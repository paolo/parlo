# Parlo

**Say it like a local, in Spanish, English and French.**

Live: **https://parlo-flax.vercel.app** (sign in with Google)

I'm a native Spanish speaker, advanced in English and intermediate in French, and I switch between
the three every day. Word-for-word translators miss what I actually need: the colloquial meaning,
the idiom a native would use, and a gentle "that sounds off, here's why" when my French (or
sometimes even my Spanish) isn't quite right. Parlo is that tool.

Type a phrase in any of the three languages. Parlo:

- **detects the language** and translates the **intended meaning** into the other two, keeping tone,
  slang and idioms ("estoy hasta las narices" becomes "I'm fed up" / "j'en ai marre", not noses);
- **suggests a correction** when the phrase is ungrammatical or unnatural, with a short explanation
  in your strongest language. False friends ("je suis excité pour la fête"), calques ("me late the
  train") and common slips ("I could of") all get caught;
- adds **notes** when something is worth knowing (regional usage, an idiom with no direct
  equivalent);
- **saves every phrase as a linked trio** (ES/EN/FR) with the version you typed marked as the
  original, so your history can later be browsed in any language.

Translation runs on **Claude Haiku 5.5** with structured outputs.

## What works

- Google sign-in (email/password exists in development only; it's disabled in production, client
  and server).
- Translate: language detection, three-way translation, corrections with explanations, notes, copy
  buttons, and a Ctrl/⌘+Enter shortcut.
- Every translation is persisted (group, three phrases, correction, notes) in Postgres (Neon).
- Rate limiting per user: a **daily quota** (default 50, overridable per user) and a **burst limit**
  (10/min). There's a usage badge in the header, and friendly messages for 429s, unsupported
  languages and model failures. Failed attempts don't use quota.
- CI on every push (lint, typecheck, unit, integration against Postgres, build); production
  migrations run from CI on `main`.

## What's incomplete

Designed and planned, not built within the timebox (the pages say "Coming next"):

- **History**: browse saved phrases in ES, EN or FR, accept a correction, star or delete. The data
  is already stored.
- **Phrasebook**: favorites plus search.
- **Profile**: language levels per user. The prompt already uses levels to pick the explanation
  language and depth; until this page exists, everyone defaults to "intermediate".

Known limitations:

- Haiku 5.5 sometimes misses subtle native-speaker slips (e.g. "fuistes" for "fuiste"). These are
  tracked as seed cases for a prompt eval set.
- The rate limiter checks and then records, so concurrent bursts can overshoot by a request or two.

The full roadmap is in the [plan](docs/plans/2026-10-09-parlo-plan.md).

## Run locally

Requirements: Node 24, Docker.

```bash
npm install
cp .env.example .env.local   # fill in the values; comments in the file explain each one
npm run db:up                # Postgres 17 in Docker (creates the parlo and parlo_test databases)
npm run db:migrate
npm run dev                  # http://localhost:3000
```

Locally you can sign in with email and password (sign up from the sign-in page), so Google
credentials are optional for a quick look. `ANTHROPIC_API_KEY` is required to translate.

## Tests

```bash
npm test          # unit + component tests (no network, no database)
npm run test:int  # integration tests against the Docker test database (npm run db:up first)
npm run test:all  # both
npm run smoke:haiku -- "me late the train"   # one live call to the real model (uses your key)
```

The suite follows a test pyramid: mostly fast unit and component tests, a few integration tests
against real Postgres, and no e2e tests yet. CI never calls the model; a fake translator stands in.

## How it's built

Next.js 16 (App Router, Route Handlers) · TypeScript · Mantine · TanStack Query · Drizzle + Postgres
(Docker locally, Neon in production) · Better Auth · Anthropic SDK (`claude-haiku-5-5`) · Zod ·
Vitest · Biome · GitHub Actions · Vercel.

- `src/server/` is framework-free domain code. The `Translator`, `PhraseRepository` and
  `UsageLimiter` interfaces each have one real implementation and test fakes; `container.ts` wires
  them together.
- `src/app/api/` route handlers are thin: authenticate, validate with Zod, call the domain, map
  errors to status codes.
- `src/ui/` holds Mantine components and data hooks. Styling uses the Mantine theme only (no CSS
  files).

Design decisions are in the [spec](docs/specs/2026-10-09-parlo-design.md); the task-by-task log
with the reasoning behind each step is in the [plan](docs/plans/2026-10-09-parlo-plan.md).

## Timebox

The scaffold was created at 01:33 UTC (create-next-app, before the timebox). Planning and the spec
started at 02:20 UTC; implementation started at 02:49 UTC; this note was written at 04:15 UTC. I
built it with Claude Code as a pair, working task by task and reviewing each step; the commit
history shows one merge per feature.
