# Parlo

**Say it like a local, in your own languages.**

Live: **https://parlo.fun** (sign in with Google). It's installable on a phone's home screen.

I'm a native Spanish speaker, advanced in English and intermediate in French, and I switch between
the three every day. Word-for-word translators miss what I actually need: the colloquial meaning,
the idiom a native would use, and a gentle "that sounds off, here's why" when my French (or
sometimes even my Spanish) isn't quite right. Parlo is that tool.

Pick your three languages (13 are supported, each with an optional region such as Spanish from
Bolivia), then type a phrase in any of them. Parlo:

- **detects the language** and translates the **intended meaning** into the other two, keeping tone,
  slang and idioms ("estoy hasta las narices" becomes "I'm fed up" / "j'en ai marre", not noses);
- **suggests a correction** when the phrase is ungrammatical or unnatural, with a short explanation
  in your strongest language. False friends ("je suis excité pour la fête"), calques ("me late the
  train") and common slips ("I could of") all get caught;
- adds **notes** when something is worth knowing (regional usage, an idiom with no direct
  equivalent);
- **saves every phrase as a linked trio** in your three languages with the version you typed marked as the
  original, so your history can later be browsed in any language.

Translation runs on **Claude Haiku 5.5** with structured outputs.

## What works

- Google sign-in (email/password exists in development only; it's disabled in production, client
  and server). Signed-out visitors see a landing page with a rotating three-language phrase.
- **Translate**: language detection, three-way translation, corrections with explanations (accepted
  with one click, which replaces the stored phrase), notes, copy buttons, a Ctrl/⌘+Enter shortcut and
  a favorite star. Every translation is saved (group, three phrases, correction, notes) in Postgres
  (Neon).
- **Phrasebook**: your **Favorites** and **All** saved phrases, newest first, 20 at a time, viewable in
  all your languages or one, with delete. It keeps your last 500 phrases (`HISTORY_LIMIT`);
  favorites are never pruned and are capped at `PHRASEBOOK_LIMIT` (default 100).
- **Practice**: flashcards dealt as a deck, with no model calls and no quota. Pick a source
  (**Favorites**, **Recent** or **Starter**), 5, 10 or 20 cards, reveal the answer or type it (checked
  on the device) and the languages to practice. Starter is a built-in set of 100 everyday phrases
  (greetings, transit, shops, restaurants, health, work and school, housing, phone and banking, small
  talk, emergencies), pre-translated into all 13 languages. You can favorite a Starter phrase from
  its card. Your last choices are remembered.
- **Profile**: your three languages (13 are supported, each with an optional region such as Spanish
  from Bolivia; the first is your native one) and a System, Light or Dark theme.
- **Usage**: a **daily quota** (default 50 translations, overridable per user) and a **burst limit**
  (10/min), shown as a ring around your avatar. Each use is recorded with its cost and token counts
  (`npm run usage:cost` reports spend). There are friendly messages for 429s, unsupported languages
  and model failures, and failed attempts don't use quota.
- **Installable**: a web app manifest and icons, plus an install prompt (iOS steps included).
- CI on every push and pull request (lint, typecheck, unit, integration against Postgres, build);
  production migrations run from CI on `main`.

## What's incomplete

Designed and planned, not built yet:

- **Search** in the Phrasebook.
- **Practice extras**: listening and spaced repetition. Practice doesn't remember which cards were
  hard.
- **Profile levels**: your languages and regions are editable, but levels per language are not yet;
  your native language gets the explanations and the other two default to "intermediate".
- More **bundles** besides Starter (seasonal sets, for example). Adding one is a data-only change in
  `src/shared/bundles/`.

Known limitations:

- Haiku 5.5 sometimes misses subtle native-speaker slips (e.g. "fuistes" for "fuiste"). These are
  tracked as seed cases for a prompt eval set.
- The rate limiter checks and then records, so concurrent bursts can overshoot by a request or two.
- There are no end-to-end tests yet.

The original roadmap is in the [first plan](docs/plans/2026-10-09-parlo-plan.md); later features each
have their own spec and plan in `docs/specs/` and `docs/plans/`.

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

Before a commit, also run `npm run lint` and `npm run typecheck`.

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
- `src/shared/` holds what the server and the UI both use: the language list and the Starter bundle.
- `src/ui/` holds Mantine components and data hooks. Styling is Mantine plus CSS Modules for bespoke
  surfaces, all driven by the design tokens in `src/styles/tokens.css`.

Design decisions are in the [specs](docs/specs/), starting with the
[original design](docs/specs/2026-10-09-parlo-design.md); the task-by-task logs with the reasoning
behind each step are in the [plans](docs/plans/).
