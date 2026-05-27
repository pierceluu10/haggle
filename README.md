# Haggle — Concierge Demo

<<<<<<< Updated upstream
Haggle lets an AI voice agent call local service businesses, collect quote details, compare options, and negotiate only after the user approves limits.
=======
Hackathon MVP: talk to **Haggle Concierge**, pick one of three hardcoded contacts, and place an outbound call. Contact **#3** is `647-261-6387` (your demo line).
>>>>>>> Stashed changes

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo mode** (`DEMO_MODE=true`, default) needs no API keys — calls return instant mock results.

## Live calls

In `.env.local`:

```bash
DEMO_MODE=false
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...          # Concierge / negotiator — same agent is fine
ELEVENLABS_PHONE_NUMBER_ID=...
ELEVENLABS_WEBHOOK_SECRET=...    # optional in demo
```

Point the ElevenLabs post-call webhook to:

<<<<<<< Updated upstream
=======
`https://<your-host>/api/webhooks/elevenlabs`

## Flow

1. Tap the mic → talk to **live Concierge** (ElevenLabs) when keys are set.
2. Say **“pull up local car dealerships”** → three dealers appear (including `647-261-6387`).
3. Say **“call the third number”** → **negotiator** agent fires an outbound call.
4. Press **F** for the hardcoded Honda Type R negotiation summary.

Agent system prompts and client tool names: see **`AGENT-PROMPTS.md`**.

>>>>>>> Stashed changes
## Scripts

```bash
npm run dev
npm run build
npm run test
npm run typecheck
```

Styling follows `DESIGN.md` (Inter body, EB Garamond display, atmospheric tokens) on a dark voice shell matching the Concierge mockup.
