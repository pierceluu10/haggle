"use client";

import { DEMO_CONTACTS } from "@/lib/contacts";
import { buildHondaNegotiationDemoResult } from "@/lib/demo-call";
import {
  AudioLines,
  BadgeCheck,
  Check,
  Mic,
  MoveRight,
  PhoneCall,
  PhoneOutgoing
} from "lucide-react";

const DEMO_DEALER = DEMO_CONTACTS[2];
const NEGOTIATION = buildHondaNegotiationDemoResult(DEMO_DEALER);

const TRANSCRIPT = NEGOTIATION.transcript.split("\n").map((line) => {
  const split = line.indexOf(": ");
  const speaker = line.slice(0, split);
  const text = line.slice(split + 2);
  return {
    speaker,
    text,
    fromHaggle: speaker.toLowerCase().includes("negotiator")
  };
});

const STEPS = [
  {
    title: "Tell Haggle what you're after",
    body: "Speak naturally — “pull up local car dealers.” The Concierge works out what you want and who's worth calling."
  },
  {
    title: "It dials and negotiates",
    body: "The Negotiator calls each business, holds firm on price, and cites competing quotes to move the number in your favor."
  },
  {
    title: "You get the deal",
    body: "Price, availability, and exactly what was said on the line — handed back to you the moment the call wraps."
  }
];

export default function Story({ onStart }: { onStart: () => void }) {
  return (
    <>
      {/* ── Two agents ──────────────────────────────────────────────── */}
      <section id="agents" className="border-t border-hairline bg-canvas-soft">
        <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance font-display text-[1.9rem] leading-tight text-ink sm:text-4xl">
              Two agents, one deal
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-body">
              You only ever talk to one voice. Behind it, two specialists split the
              work — one that listens, one that goes out on the line.
            </p>
          </div>

          <div className="mt-12 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
            <article className="flex-1 rounded-xl border border-hairline bg-paper p-6 shadow-card sm:p-7">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-pine-soft text-pine">
                <AudioLines className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">The Concierge</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-body">
                Your in-app voice. It listens, understands what you&rsquo;re after,
                surfaces the options, and decides who&rsquo;s worth a call.
              </p>
              <p className="mt-5 text-[13px] font-medium text-muted">
                In the browser, with you
              </p>
            </article>

            <span
              aria-hidden
              className="mx-auto grid h-10 w-10 shrink-0 rotate-90 place-items-center rounded-full border border-hairline bg-canvas text-muted md:rotate-0"
            >
              <MoveRight className="h-[18px] w-[18px]" />
            </span>

            <article className="flex-1 rounded-xl bg-pine p-6 text-on-pine shadow-pine-glow sm:p-7">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-on-pine">
                <PhoneOutgoing className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-xl text-on-pine">The Negotiator</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-on-pine/80">
                Goes out on the phone line. It dials the businesses, holds firm, and
                won&rsquo;t take the first number it&rsquo;s quoted.
              </p>
              <p className="mt-5 text-[13px] font-medium text-on-pine/65">
                On real calls, on your behalf
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="how" className="border-t border-hairline bg-canvas">
        <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance font-display text-[1.9rem] leading-tight text-ink sm:text-4xl">
              From “find me a deal” to done
            </h2>
            <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-body">
              Three steps, and you never pick up the phone.
            </p>
          </div>

          <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden
              className="absolute left-10 right-10 top-5 hidden h-px bg-hairline-strong md:block"
            />
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-pine font-display text-lg text-on-pine shadow-pine-glow">
                  {index + 1}
                </span>
                <h3 className="mt-5 font-display text-lg text-ink">{step.title}</h3>
                <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-body">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Anatomy of a deal ───────────────────────────────────────── */}
      <section id="deal" className="border-t border-hairline bg-canvas-soft">
        <div className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <h2 className="text-balance font-display text-[1.9rem] leading-tight text-ink sm:text-4xl">
              Anatomy of a deal
            </h2>
            <p className="mt-4 max-w-lg text-pretty text-[15px] leading-relaxed text-body">
              A real run on a Honda Civic Type R. Here&rsquo;s the call the Negotiator
              made — and what it brought back.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            {/* Call log */}
            <div className="overflow-hidden rounded-xl border border-hairline bg-paper shadow-card">
              <div className="flex items-center gap-3 border-b border-hairline px-5 py-3.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-pine-soft text-pine">
                  <PhoneCall className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {DEMO_DEALER.name}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {DEMO_DEALER.displayPhone} · negotiation call
                  </p>
                </div>
              </div>
              <div className="space-y-3 px-5 py-5">
                {TRANSCRIPT.map((line, index) => (
                  <div
                    key={index}
                    className={
                      line.fromHaggle
                        ? "ml-auto max-w-[86%] rounded-lg rounded-br-sm bg-pine px-3.5 py-2.5 text-on-pine"
                        : "mr-auto max-w-[86%] rounded-lg rounded-bl-sm border border-hairline bg-canvas px-3.5 py-2.5 text-ink-soft"
                    }
                  >
                    <span
                      className={
                        line.fromHaggle
                          ? "text-[11px] font-medium uppercase tracking-wide text-on-pine/60"
                          : "text-[11px] font-medium uppercase tracking-wide text-muted"
                      }
                    >
                      {line.fromHaggle ? "Negotiator" : line.speaker}
                    </span>
                    <p
                      className={
                        line.fromHaggle
                          ? "mt-0.5 text-sm leading-relaxed text-on-pine"
                          : "mt-0.5 text-sm leading-relaxed text-ink-soft"
                      }
                    >
                      {line.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcome */}
            <div className="flex flex-col rounded-xl border border-pine/15 bg-pine-soft p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pine/80">
                Outcome
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-xl text-muted line-through">
                  $34,500
                </span>
                <MoveRight className="h-5 w-5 self-center text-pine" />
                <span className="font-display text-[2.4rem] leading-none text-pine">
                  $31,000
                </span>
              </div>
              <p className="mt-2 text-sm text-pine/80">
                out the door on a Civic Type R
              </p>

              <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-pill bg-brass-soft px-3 py-1.5 text-[13px] font-semibold text-ink-soft">
                <Check className="h-3.5 w-3.5 text-brass-deep" strokeWidth={2.5} />
                You keep $3,500
              </span>

              <ul className="mt-6 space-y-3 border-t border-pine/15 pt-5 text-sm text-body">
                {[
                  "Held firm until the competitor's written offer was cited",
                  "Price matched and locked through end of day",
                  "Paperwork ready this week if you want to move"
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-pine"
                      strokeWidth={2.25}
                    />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center gap-2 text-xs text-muted">
                <span className="h-2 w-2 rounded-full bg-success" />
                High confidence
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────────── */}
      <section id="ready" className="bg-pine text-on-pine">
        <div className="mx-auto w-full max-w-5xl px-5 py-24 text-center sm:px-8 sm:py-28">
          <h2 className="text-balance font-display text-[2rem] leading-tight text-on-pine sm:text-[2.75rem]">
            Ready to stop haggling?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-on-pine/75">
            Tap the mic, tell Haggle what you&rsquo;re shopping for, and let it make
            the calls. You stay in the loop the whole way.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-8 inline-flex items-center gap-2.5 rounded-pill bg-on-pine px-6 py-3.5 text-[15px] font-medium text-pine transition duration-200 ease-out-quart hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-pine"
          >
            <Mic className="h-[18px] w-[18px]" />
            Start a conversation
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-hairline bg-canvas">
        <div className="mx-auto w-full max-w-5xl px-5 pb-28 pt-12 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl text-ink">Haggle</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                A Concierge and a Negotiator, working the phones for a better price.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-body">
              <a className="transition hover:text-ink" href="#agents">
                The agents
              </a>
              <a className="transition hover:text-ink" href="#how">
                How it works
              </a>
              <button
                type="button"
                onClick={onStart}
                className="text-pine transition hover:text-pine-deep"
              >
                Start talking
              </button>
            </nav>
          </div>
          <div className="mt-10 flex items-center gap-2 border-t border-hairline pt-6 text-xs text-muted">
            <BadgeCheck className="h-3.5 w-3.5 text-pine" />
            Real outbound calls via ElevenLabs · you&rsquo;re always in control
          </div>
        </div>
      </footer>
    </>
  );
}
