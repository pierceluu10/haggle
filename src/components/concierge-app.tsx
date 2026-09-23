"use client";

import { DEMO_CONTACTS, getContactById } from "@/lib/contacts";
import { buildHondaNegotiationDemoResult } from "@/lib/demo-call";
import { processUserUtterance } from "@/lib/parse-intent";
import type { CallRecord, CallRole } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { useConciergeSession } from "@/hooks/use-concierge-session";
import { circlePath, useVoiceBlob } from "@/hooks/use-voice-blob";
import Story from "@/components/story";
import clsx from "clsx";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Mic,
  Phone,
  PhoneCall,
  RotateCcw,
  Settings
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "listening" | "ready" | "calling" | "done";

const CONTACT_3 = DEMO_CONTACTS[2];

const EXAMPLE_PROMPTS = [
  "Find local car dealers",
  "Call the third one",
  "Get me their best price"
];

const CONFIDENCE_STYLES: Record<string, { dot: string; label: string }> = {
  high: { dot: "bg-success", label: "High confidence" },
  medium: { dot: "bg-brass", label: "Medium confidence" },
  low: { dot: "bg-muted-soft", label: "Low confidence" }
};

type NextStep = "lock" | "schedule" | "callback";

const NEXT_STEP_CONFIRMATIONS: Record<NextStep, string> = {
  lock: "Price locked at $31,000 OTD. Paperwork is on its way to your inbox.",
  schedule: "Pickup scheduled — Durham Honda will confirm a window with you shortly.",
  callback: "Haggle will call back to confirm the paperwork and hold the price through today."
};

type CallApiResponse = {
  call?: CallRecord;
  live?: boolean;
  hint?: string;
  errors?: Array<{ message: string }>;
};

async function postCall(
  contactId: string,
  role: CallRole,
  userMessage?: string
): Promise<CallApiResponse> {
  const response = await fetch("/api/call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactId, role, userMessage })
  });
  const payload = (await response.json()) as CallApiResponse;
  if (!response.ok || !payload.call) {
    throw new Error(payload.errors?.[0]?.message || payload.hint || "Call failed.");
  }
  return payload;
}

async function pollCall(id: string): Promise<CallRecord> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const response = await fetch(`/api/call/${id}`);
    const payload = (await response.json()) as { call?: CallRecord };
    if (payload.call?.status === "completed" || payload.call?.status === "failed") {
      return payload.call;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Call timed out.");
}

function demoHondaCallRecord(): CallRecord {
  const stamp = nowIso();
  return {
    id: "demo_honda_f",
    contactId: CONTACT_3.id,
    contactName: CONTACT_3.name,
    contactPhone: CONTACT_3.phone,
    role: "negotiation",
    status: "completed",
    createdAt: stamp,
    updatedAt: stamp,
    result: buildHondaNegotiationDemoResult(CONTACT_3)
  };
}

export default function ConciergeApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [showDealers, setShowDealers] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [callingContactId, setCallingContactId] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<NextStep | null>(null);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const orbStageRef = useRef<HTMLDivElement>(null);
  const blobPathRef = useRef<SVGPathElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const callingRef = useRef(false);
  const placeCallRef = useRef<
    (contactId: string, role: CallRole, userMessage?: string) => Promise<void>
  >(() => Promise.resolve());

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const placeCall = useCallback(
    async (contactId: string, role: CallRole = "inquiry", userMessage?: string) => {
      if (callingRef.current) return;
      callingRef.current = true;
      setError("");
      setActiveCall(null);
      setNextStep(null);
      setCallingContactId(contactId);
      setPhase("calling");

      // Demo: the highlighted dealer skips the real outbound call and plays
      // back a mock negotiation so you can see what Haggle brings back, then
      // continue from the deal card's next steps.
      if (role === "negotiation") {
        await new Promise((resolve) => setTimeout(resolve, 1800));
        setActiveCall(demoHondaCallRecord());
        setPhase("done");
        callingRef.current = false;
        return;
      }

      try {
        const payload = await postCall(contactId, role, userMessage);

        let call = payload.call!;
        if (call.status === "calling") {
          call = await pollCall(call.id);
        }
        setActiveCall(call);
        setPhase("done");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Call failed.");
        setPhase("ready");
      } finally {
        callingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    placeCallRef.current = placeCall;
  }, [placeCall]);

  const handleUserUtterance = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || callingRef.current) return;

    setTranscript(trimmed);
    if (phaseRef.current === "idle") {
      setPhase("ready");
    }

    processUserUtterance(trimmed, DEMO_CONTACTS, {
      onShowDealers: () => setShowDealers(true),
      onCall: (target, role, message) => {
        void placeCallRef.current(target.id, role, message);
      }
    });
  }, []);

  const dispatchNegotiatorThird = useCallback(() => {
    if (!showDealers) {
      setShowDealers(true);
    }
    void placeCallRef.current(CONTACT_3.id, "negotiation", "Call the third number");
  }, [showDealers]);

  const { liveEnabled, startConcierge, stopConcierge, isConnected, isSpeaking } =
    useConciergeSession({
      onUserUtterance: handleUserUtterance,
      onShowDealers: () => setShowDealers(true),
      onDispatchNegotiatorThird: dispatchNegotiatorThird,
      onError: setError
    });

  const showHondaSummary = useCallback(() => {
    setError("");
    setNextStep(null);
    setActiveCall(demoHondaCallRecord());
    setPhase("done");
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "f") return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      event.preventDefault();
      showHondaSummary();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHondaSummary]);

  const startBrowserListening = useCallback(() => {
    setError("");
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setPhase("ready");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setPhase("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      handleUserUtterance(text);
    };

    recognition.onerror = () => setPhase("ready");

    recognition.onend = () => {
      if (phaseRef.current === "listening") {
        setPhase("ready");
      }
    };

    recognition.start();
  }, [handleUserUtterance]);

  const toggleMic = useCallback(async () => {
    if (phase === "calling") return;

    if (liveEnabled) {
      try {
        if (isConnected) {
          await stopConcierge();
          setPhase("idle");
          return;
        }
        setPhase("listening");
        await startConcierge();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Concierge failed to start.");
        setPhase("idle");
        startBrowserListening();
      }
      return;
    }

    if (phase === "listening") {
      recognitionRef.current?.stop();
      setPhase("idle");
      return;
    }

    startBrowserListening();
  }, [isConnected, liveEnabled, phase, startBrowserListening, startConcierge, stopConcierge]);

  const resetSession = useCallback(async () => {
    recognitionRef.current?.stop();
    if (isConnected) {
      await stopConcierge();
    }
    callingRef.current = false;
    setPhase("idle");
    setShowDealers(false);
    setTranscript("");
    setActiveCall(null);
    setCallingContactId(null);
    setNextStep(null);
    setError("");
  }, [isConnected, stopConcierge]);

  const listening = phase === "listening" || isConnected;
  const calling = phase === "calling";
  const showResultCard = Boolean(activeCall?.result);
  const showHero = !listening && !calling && !showDealers && !showResultCard;
  const callingContact = callingContactId ? getContactById(callingContactId) : undefined;
  const hasActivity = listening || calling || showResultCard || showDealers || Boolean(transcript);

  useVoiceBlob({
    pathRef: blobPathRef,
    stageRef: orbStageRef,
    active: listening,
    speaking: isSpeaking
  });

  const handleStart = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!listening && phase !== "calling") {
      void toggleMic();
    }
  }, [listening, phase, toggleMic]);

  return (
    <main className="stage relative flex min-h-screen flex-col text-ink">
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-hairline/70 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-2xl leading-none text-ink">Haggle</span>
            <span aria-hidden className="hidden h-3.5 w-px bg-hairline-strong sm:block" />
            <span className="hidden text-[13px] font-medium tracking-wide text-muted sm:block">
              Concierge
            </span>
          </div>
          <button
            type="button"
            aria-label="Settings"
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-canvas-soft hover:text-ink focus-visible:outline-none focus-visible:shadow-focus"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      {/* ── Console hero ──────────────────────────────────────────────── */}
      <section
        className={clsx(
          "relative z-10 flex w-full flex-1 flex-col items-center px-5 pb-32",
          hasActivity ? "justify-start pt-12 sm:pt-16" : "justify-center pt-6"
        )}
        style={{ minHeight: "calc(100svh - 3.75rem)" }}
      >
        <div className="flex w-full max-w-md flex-col items-center">
          {/* Voice presence — the rim is a live waveform of your voice */}
          <div
            ref={orbStageRef}
            className="orb-stage h-56 w-56 sm:h-64 sm:w-64"
          >
            <svg width="0" height="0" aria-hidden className="absolute">
              <defs>
                <clipPath id="orb-blob" clipPathUnits="objectBoundingBox">
                  <path ref={blobPathRef} d={circlePath()} />
                </clipPath>
              </defs>
            </svg>
            <span className="orb-glow" />
            {calling ? <span className="work-ring" /> : null}
            <span className="orb-shadow" />
            <span className="orb orb-wave block h-full w-full" />
          </div>

          {/* Idle hero — teaches the interface */}
          {showHero ? (
            <div className="mt-10 max-w-sm animate-rise text-center">
              <h1 className="text-balance font-display text-[2rem] leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.4rem]">
                Let me do the haggling.
              </h1>
              <p className="mx-auto mt-4 max-w-xs text-pretty text-[15px] leading-relaxed text-body">
                Tell me what you&rsquo;re shopping for. I&rsquo;ll call around, push on
                price, and bring back the deal.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <span
                    key={prompt}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-hairline bg-canvas-soft px-3 py-1.5 text-[13px] text-muted"
                  >
                    <Mic className="h-3 w-3 text-pine" aria-hidden />
                    {prompt}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Live status */}
          {listening ? (
            <div className="mt-9 flex animate-fade-in flex-col items-center">
              <span className="flex items-center gap-2 text-sm font-medium text-pine">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine/50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-pine" />
                </span>
                {isSpeaking ? "Haggle is speaking" : "Listening"}
              </span>
            </div>
          ) : null}

          {/* Calling status */}
          {calling ? (
            <div className="mt-9 animate-fade-in text-center">
              <p className="text-sm font-medium text-brass-deep">
                On the line{callingContact ? ` with ${callingContact.name}` : ""}&hellip;
              </p>
              <p className="mt-1.5 text-[13px] text-muted">Pushing for your best price.</p>
            </div>
          ) : null}

          {/* Latest utterance */}
          {transcript && !showResultCard ? (
            <p
              className={clsx(
                "max-w-sm animate-fade-in text-balance text-center font-display text-lg italic leading-snug text-ink-soft",
                listening || calling ? "mt-5" : "mt-9"
              )}
            >
              &ldquo;{transcript}&rdquo;
            </p>
          ) : null}

          {/* Inline error */}
          {error ? (
            <p className="mt-6 max-w-sm animate-fade-in rounded-md border border-error/25 bg-error/[0.06] px-4 py-2.5 text-center text-sm text-error">
              {error}
            </p>
          ) : null}
        </div>

        {/* ── Dealer list ─────────────────────────────────────────────── */}
        {showDealers ? (
          <section className="mt-12 w-full max-w-md animate-rise">
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="font-display text-lg text-ink">Local dealers</h2>
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {DEMO_CONTACTS.length} nearby
              </span>
            </div>
            <ul className="space-y-2">
              {DEMO_CONTACTS.map((contact, index) => {
                const isLive = index === 2;
                const isCallingThis = calling && callingContactId === contact.id;
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      disabled={calling}
                      onClick={() => {
                        void placeCall(contact.id, isLive ? "negotiation" : "inquiry");
                      }}
                      className={clsx(
                        "group flex w-full items-center gap-3.5 rounded-lg border px-3.5 py-3 text-left transition duration-200 ease-out-quart",
                        "focus-visible:outline-none focus-visible:shadow-focus",
                        isLive ? "border-pine/25 bg-pine-soft" : "border-hairline bg-paper",
                        !calling && "hover:-translate-y-0.5 hover:shadow-card-hover",
                        isCallingThis && "-translate-y-0.5 shadow-card-hover",
                        calling && !isCallingThis && "opacity-45"
                      )}
                    >
                      <span
                        className={clsx(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-base",
                          isLive
                            ? "bg-pine text-on-pine"
                            : "border border-hairline bg-canvas text-ink-soft"
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-medium text-ink">
                            {contact.name}
                          </span>
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 rounded-pill bg-pine/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pine">
                              <span className="h-1.5 w-1.5 rounded-full bg-pine" />
                              Live
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {contact.role}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="hidden tabular-nums text-sm text-body sm:block">
                          {contact.displayPhone}
                        </span>
                        <span
                          className={clsx(
                            "grid h-9 w-9 place-items-center rounded-full transition",
                            isLive
                              ? "bg-pine text-on-pine group-hover:bg-pine-deep"
                              : "border border-hairline bg-canvas-soft text-pine group-hover:border-pine/40"
                          )}
                        >
                          {isCallingThis ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Phone className="h-4 w-4" />
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* ── The deal ────────────────────────────────────────────────── */}
        {showResultCard && activeCall?.result ? (
          <section className="mt-10 w-full max-w-md animate-rise">
            <article className="overflow-hidden rounded-xl border border-hairline bg-paper shadow-card">
              <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-deep">
                    Deal closed
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl leading-tight text-ink">
                    {activeCall.contactName}
                  </h2>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pine text-on-pine shadow-pine-glow">
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                </span>
              </div>

              <div className="px-5 py-5">
                <p className="text-[15px] leading-relaxed text-body">
                  {activeCall.result.summary}
                </p>

                <div className="mt-4 rounded-md border border-pine/15 bg-pine-soft px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pine/80">
                    Price
                  </p>
                  <p className="mt-1 text-[15px] font-medium leading-snug text-pine">
                    {activeCall.result.priceText}
                  </p>
                </div>

                <dl className="mt-4 divide-y divide-hairline text-sm">
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Availability</dt>
                    <dd className="text-right font-medium text-ink-soft">
                      {activeCall.result.availability}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">Timeline</dt>
                    <dd className="text-right font-medium text-ink-soft">
                      {activeCall.result.timeline}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 border-t border-hairline pt-4 font-display text-[15px] italic leading-relaxed text-muted">
                  {activeCall.result.serviceNotes}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                  <span
                    className={clsx(
                      "h-2 w-2 rounded-full",
                      (CONFIDENCE_STYLES[activeCall.result.confidence] ?? CONFIDENCE_STYLES.low)
                        .dot
                    )}
                  />
                  {(CONFIDENCE_STYLES[activeCall.result.confidence] ?? CONFIDENCE_STYLES.low).label}
                </div>

                {/* ── Next steps ──────────────────────────────────────── */}
                <div className="mt-5 border-t border-hairline pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Next steps
                  </p>

                  {nextStep ? (
                    <div className="mt-3 flex items-start gap-2.5 rounded-md border border-pine/15 bg-pine-soft px-4 py-3 animate-fade-in">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-pine"
                        strokeWidth={2.5}
                      />
                      <p className="text-sm leading-snug text-pine">
                        {NEXT_STEP_CONFIRMATIONS[nextStep]}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => setNextStep("lock")}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-on-pine shadow-pine-glow transition duration-200 ease-out-quart hover:bg-pine-deep focus-visible:outline-none focus-visible:shadow-focus"
                      >
                        <Lock className="h-4 w-4" />
                        Lock in this price
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNextStep("schedule")}
                          className="flex items-center justify-center gap-2 rounded-lg border border-hairline bg-canvas-soft px-3 py-2.5 text-sm font-medium text-ink-soft transition duration-200 ease-out-quart hover:border-pine/40 hover:text-pine focus-visible:outline-none focus-visible:shadow-focus"
                        >
                          <CalendarClock className="h-4 w-4" />
                          Schedule pickup
                        </button>
                        <button
                          type="button"
                          onClick={() => setNextStep("callback")}
                          className="flex items-center justify-center gap-2 rounded-lg border border-hairline bg-canvas-soft px-3 py-2.5 text-sm font-medium text-ink-soft transition duration-200 ease-out-quart hover:border-pine/40 hover:text-pine focus-visible:outline-none focus-visible:shadow-focus"
                        >
                          <PhoneCall className="h-4 w-4" />
                          Call back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </section>
        ) : null}

        {/* Scroll cue */}
        {showHero ? (
          <a
            href="#agents"
            className="group absolute bottom-28 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-muted transition hover:text-ink sm:flex"
          >
            See how it works
            <ChevronDown className="h-4 w-4 animate-bounce text-muted group-hover:text-ink" />
          </a>
        ) : null}
      </section>

      {/* ── Story ─────────────────────────────────────────────────────── */}
      <Story onStart={handleStart} />

      {/* ── Control bar ───────────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-7 z-40 flex justify-center px-6">
        <div className="control-bar flex items-center gap-2 rounded-pill p-2">
          <button
            type="button"
            aria-label="Reset session"
            onClick={() => void resetSession()}
            disabled={!hasActivity}
            className="grid h-12 w-12 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <RotateCcw className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label={listening ? "Stop listening" : "Talk to Haggle"}
            aria-pressed={listening}
            onClick={() => void toggleMic()}
            disabled={calling}
            className={clsx(
              "grid h-14 w-14 place-items-center rounded-full transition duration-200 ease-out-quart focus-visible:outline-none focus-visible:shadow-focus",
              listening
                ? "bg-pine text-on-pine shadow-pine-glow"
                : "bg-ink text-paper hover:bg-ink-soft",
              calling && "opacity-40"
            )}
          >
            <Mic className="h-[22px] w-[22px]" />
          </button>
        </div>
      </div>
    </main>
  );
}
