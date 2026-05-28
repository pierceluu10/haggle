# Haggle

Haggle is a voice-first app that helps you shop and negotiate by phone. You talk to a **Concierge** in the browser; when you’re ready, it hands off to a **Negotiator** that places real outbound calls and brings back what happened on the line.

## Overview

One product, two ElevenLabs agents:

- **Concierge** — your in-app voice assistant. You describe what you need, ask for options, and decide who to call.
- **Negotiator** — the outbound caller. It dials businesses on your behalf (today wired for negotiation-style calls to the third contact in the list).

The current build focuses on **local car dealerships**: three preset contacts, live Concierge conversation, and negotiator outbound calls through ElevenLabs + Twilio.

## How it works

1. **Open the app** and tap the mic. You’re connected to the Concierge (ElevenLabs conversational AI when configured).
2. **Ask for what you need** — e.g. *“Pull up local car dealerships.”* The app shows three dealers (names and numbers).
3. **Choose who to call** — e.g. *“Call the third number.”* The Concierge dispatches the **Negotiator**, which places an outbound call via ElevenLabs.
4. **See the outcome** — after the call, results appear in the UI (live: from the post-call webhook when set up; you can also press **F** to show a preset negotiation summary for demos).

The Concierge does not dial numbers itself. It routes the request; the Negotiator agent and `/api/call` handle the actual phone call.

## Architecture

```
Browser (voice UI)
    │
    ├─► ElevenLabs Concierge  — live session via signed URL
    │       client tools: show dealers, dispatch negotiator
    │       + local speech intent parsing as fallback
    │
    └─► POST /api/call  — outbound call (Negotiator agent)
            │
            ├─► ElevenLabs Twilio outbound API
            │
            └─► POST /api/webhooks/elevenlabs  — post-call transcript → UI
```

| Piece | Role |
|--------|------|
| `src/components/concierge-app.tsx` | Voice UI, dealer list, call results |
| `src/hooks/use-concierge-session.ts` | Concierge session + client tools |
| `src/lib/parse-intent.ts` | Maps phrases to “show dealers” / “call #N” |
| `src/lib/contacts.ts` | Three hardcoded dealership contacts |
| `src/app/api/call/route.ts` | Starts outbound calls |
| `src/lib/call-store.ts` | In-memory call state (dev / single instance) |

Agent prompts and ElevenLabs tool names: **`AGENT-PROMPTS.md`**.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local`. For real Concierge + outbound calls:

```bash
DEMO_MODE=false

ELEVENLABS_API_KEY=
ELEVENLABS_INQUIRY_AGENT_ID=      # Concierge
ELEVENLABS_NEGOTIATION_AGENT_ID=  # Negotiator (outbound)
ELEVENLABS_PHONE_NUMBER_ID=
ELEVENLABS_WEBHOOK_SECRET=        # optional; needed for live call summaries
```

Webhook URL (when deployed or tunneled):

`https://<your-host>/api/webhooks/elevenlabs`

With `DEMO_MODE=true`, the UI runs without ringing a phone; outbound negotiation calls return a configuration hint instead of placing a call.

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run typecheck
```

UI styling is documented in **`DESIGN.md`**.
