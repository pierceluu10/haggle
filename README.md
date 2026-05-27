# Haggle

Haggle lets an AI voice agent call local service businesses, collect quote details, compare options, and negotiate only after the user approves limits.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Demo mode is enabled by default when live credentials are missing. To force demo mode, set `DEMO_MODE=true`.

## Environment

Copy `.env.example` to `.env.local` and fill in any live integrations you want to use.

Required for live calls:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_AGENT_ID`
- `ELEVENLABS_PHONE_NUMBER_ID`
- `ELEVENLABS_WEBHOOK_SECRET`

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run typecheck
```
