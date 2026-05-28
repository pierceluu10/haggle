# Haggle

Haggle is a voice-first app that helps you shop and negotiate by phone. You talk to a **Concierge** in the browser; when you’re ready, it hands off to a **Negotiator** that places real outbound calls and brings back what happened on the line.

## Overview

**Two Agents:**

- **Concierge** — your in-app voice assistant. You describe what you need, ask for options, and decide who to call.
- **Negotiator** — the outbound caller. It dials businesses on your behalf.

The current build focuses on **local car dealerships**: three preset contacts, live Concierge conversation, and negotiator outbound calls through ElevenLabs + Twilio.

## How it works

1. **Open the app** and tap the mic. You’re connected to the Concierge (ElevenLabs conversational AI when configured).
2. **Ask for what you need** — e.g. *“Pull up local car dealerships.”* The app shows three dealers (names and numbers).
3. **Choose who to call** — e.g. *“Call the third number.”* The Concierge dispatches the **Negotiator**, which places an outbound call via ElevenLabs.
4. **See the outcome** — after the call, results appear in the UI.

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
