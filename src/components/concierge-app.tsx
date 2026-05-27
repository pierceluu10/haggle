"use client";

import { DEMO_CONTACTS } from "@/lib/contacts";
import { buildHondaNegotiationDemoResult } from "@/lib/demo-call";
import { processUserUtterance } from "@/lib/parse-intent";
import type { CallRecord, CallRole } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { useConciergeSession } from "@/hooks/use-concierge-session";
import clsx from "clsx";
import { Mic, Settings, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "listening" | "ready" | "calling" | "done";

const CONTACT_3 = DEMO_CONTACTS[2];

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

function phaseLabel(
  phase: Phase,
  listening: boolean,
  isSpeaking: boolean
): string | null {
  if (listening) {
    return isSpeaking ? "Speaking" : "Listening";
  }
  if (phase === "calling") return "Calling";
  if (phase === "done") return null;
  if (phase === "ready") return null;
  return null;
}

export default function ConciergeApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [showDealers, setShowDealers] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
      setPhase("calling");

      try {
        const payload = await postCall(contactId, role, userMessage);

        if (role === "negotiation") {
          if (!payload.live) {
            setPhase("ready");
            setError(payload.hint || "Outbound calls are disabled.");
            return;
          }

          if (payload.call?.status === "calling") {
            try {
              await pollCall(payload.call.id);
            } catch {
              // Negotiation result is shown via F only.
            }
          }

          setPhase("ready");
          return;
        }

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
    setError("");
  }, [isConnected, stopConcierge]);

  const listening = phase === "listening" || isConnected;
  const showContacts = showDealers;
  const showResultCard = Boolean(activeCall?.result);
  const status = phaseLabel(phase, listening, isSpeaking);

  return (
    <main className="voice-bg relative flex min-h-screen flex-col items-center overflow-hidden text-white">
      <button
        type="button"
        aria-label="Settings"
        className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full text-white/50 transition hover:text-white/80"
      >
        <Settings className="h-5 w-5" />
      </button>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-36 pt-16">
        <div
          className={clsx(
            "relative h-52 w-52 rounded-full voice-orb-ring sm:h-60 sm:w-60",
            listening || phase === "calling" ? "animate-orb-pulse" : ""
          )}
        >
          <div className="voice-orb relative h-full w-full overflow-hidden rounded-full" />
        </div>

        {!listening && phase !== "calling" && !showResultCard ? (
          <p className="mt-10 text-center font-sans text-lg font-medium tracking-wide text-white/95">
            Hi, I&apos;m Haggle AI
          </p>
        ) : status ? (
          <p className="mt-10 text-center font-sans text-sm font-medium tracking-wide text-white/50">
            {status}
          </p>
        ) : null}

        {transcript ? (
          <p className="mt-6 max-w-md text-center text-sm text-white/60">&ldquo;{transcript}&rdquo;</p>
        ) : null}

        {error ? (
          <p className="mt-4 max-w-md text-center text-sm text-red-400">{error}</p>
        ) : null}

        {showContacts ? (
          <div className="mt-10 w-full max-w-md space-y-2">
            <p className="mb-3 text-center font-sans text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
              Local dealerships
            </p>
            {DEMO_CONTACTS.map((contact, index) => (
              <button
                key={contact.id}
                type="button"
                disabled={phase === "calling"}
                onClick={() => {
                  void placeCall(contact.id, index === 2 ? "negotiation" : "inquiry");
                }}
                className={clsx(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                  index === 2
                    ? "border-white/20 bg-white/10 hover:bg-white/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10",
                  phase === "calling" && "opacity-50"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {index + 1}. {contact.name}
                  </p>
                  <p className="text-xs text-white/45">{contact.role}</p>
                </div>
                <span className="font-mono text-sm text-white/70">{contact.displayPhone}</span>
              </button>
            ))}
          </div>
        ) : null}

        {showResultCard ? (
          <article className="mt-8 w-full max-w-lg rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xl font-light tracking-tight text-white">
                {activeCall?.contactName}
              </p>
              <span className="rounded-pill border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white/60">
                Negotiator
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{activeCall?.result?.summary}</p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4 border-t border-white/10 pt-2">
                <dt className="text-white/45">Price</dt>
                <dd className="text-right text-white/85">{activeCall?.result?.priceText}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/45">Availability</dt>
                <dd className="text-right text-white/85">{activeCall?.result?.availability}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/45">Timeline</dt>
                <dd className="text-right text-white/85">{activeCall?.result?.timeline}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-white/40">
              {activeCall?.result?.serviceNotes}
            </p>
          </article>
        ) : null}
      </div>

      <div className="fixed bottom-10 left-0 right-0 flex justify-center px-6">
        <div className="control-pill flex items-center gap-3 rounded-pill px-3 py-2">
          <button
            type="button"
            aria-label="Reset"
            onClick={() => void resetSession()}
            className="grid h-12 w-12 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={listening ? "Stop" : "Talk to Concierge"}
            onClick={() => void toggleMic()}
            disabled={phase === "calling"}
            className={clsx(
              "grid h-14 w-14 place-items-center rounded-full transition",
              listening
                ? "bg-voice-glow text-white shadow-[0_0_35px_rgba(0,122,255,0.55)]"
                : "bg-white/10 text-white hover:bg-white/15",
              phase === "calling" && "opacity-40"
            )}
          >
            <Mic className="h-6 w-6" />
          </button>
        </div>
      </div>
    </main>
  );
}
