# Parlo — Implementation Plan (living)

> **For agentic workers:** this is the global plan. Before starting a task, expand it into
> bite-sized TDD steps (failing test, run, implement, run, commit) against the library versions
> actually installed, then execute with superpowers:executing-plans or
> superpowers:subagent-driven-development. Tick the checkboxes and the progress table as you go.

**Goal:** Ship Parlo, a Claude-powered ES/EN/FR phrase translator with corrections, linked
history, a phrasebook and level-aware explanations. Phase 1 is the Casper 2-hour submission;
later phases grow it into a personal product.

**Architecture:** Next.js 16 App Router with Route Handlers over a framework-free `src/server`
domain layer (Translator, repositories, UsageLimiter behind interfaces). Drizzle on Postgres
(Docker locally, Neon in production), Better Auth (Google, plus email/password in dev), Mantine UI
with TanStack Query.

**Tech stack:** Next.js 16.4, React 19.3, TypeScript, Mantine, TanStack Query, Zod, Drizzle
(`pg` driver), Better Auth, `@anthropic-ai/sdk` with `claude-haiku-5-5`, Vitest and React Testing
Library, Docker Postgres, Biome, GitHub Actions, Vercel.

**Spec:** [`docs/specs/2026-10-09-parlo-design.md`](../specs/2026-10-09-parlo-design.md)

---

## How to use this plan

- **Status markers:** `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` dropped (say why)
- **One task = one feature branch**, merged with `git merge --no-ff <branch>`; the merge title
  names the feature ("Merge translate flow"). Commits are atomic with title-only imperative
  messages and no prefixes or trailers (see `~/.claude/CLAUDE.md`).
- **Before touching Next.js APIs**, read the relevant guide in `node_modules/next/dist/docs/` (see
  `AGENTS.md`); Next 16 renamed middleware to `proxy`, among other changes.
- **Suggested model** per task (the Claude Code session model to drive it):
  - **Opus 5.5:** design-heavy or integration-risky work (auth wiring, prompt engineering, data
    model, final reviews).
  - **Sonnet 5.5:** standard feature work with clear specs (CRUD, UI, routes).
  - **Haiku 5.5:** mechanical work (config, boilerplate, docs, dependency bumps).
- **Updating the plan:** when scope changes, edit this file in the same branch as the work and keep
  the spec in sync.

## Progress

| Phase | Task | Branch | Model | Est. | Status |
|---|---|---|---|---|---|
| 0 | 0.1 Accounts and credentials | – | you + Haiku 5.5 | off-clock | [x] |
| 1 | 1.1 Tooling foundation | `tooling-foundation` | Sonnet 5.5 | 15m | [x] |
| 1 | 1.2 App shell and theme | `app-shell` | Sonnet 5.5 | 10m | [x] |
| 1 | 1.3 Database and auth | `database-auth` | Opus 5.5 | 25m | [x] |
| 1 | 1.4 First deploy (walking skeleton) | `first-deploy` | Sonnet 5.5 | 10m | [x] |
| 1 | 1.5 Translator (Haiku 5.5) | `translator` | Opus 5.5 | 15m | [x] |
| 1 | 1.6 Usage limits | `usage-limits` | Sonnet 5.5 | 10m | [x] |
| 1 | 1.7 Translate flow | `translate-flow` | Sonnet 5.5 | 20m | [x] |
| 1 | 1.8 History and phrasebook | `history-phrasebook` | Sonnet 5.5 | 15m | [ ] (favorites slice done) |
| 1 | 1.9 Language levels | `language-levels` | Sonnet 5.5 | 10m | [ ] (post-submission; builds on 1.11) |
| 1 | 1.11 Language profile | `language-profile` | Opus 5.5 / Sonnet 5.5 | – | [x] [plan](2026-10-20-language-profile-plan.md) (browser walkthrough pending) |
| 1 | 1.10 Submission README | `submission-notes` | Haiku 5.5 | 5m | [x] |
| 2 | 2.x Hardening | per task | see below | – | [ ] |
| 3 | 3.x Style variants | `style-variants` | Opus 5.5 | – | [ ] |
| 4 | 4.x Pronunciation | `pronunciation` | Sonnet 5.5 | – | [ ] |
| 5 | 5.x Level-aware learning | per task | Opus 5.5 | – | [ ] |

**Cut lines for the 2h clock:**
- After 1.7 the product is coherent: sign in, translate, corrections, usage.
- 1.8 and then 1.9 add the "multiple interactions" Casper asks for.
- If time runs out, skip what's left and still do 1.10 (5 minutes). Deploys happen on every merge
  to `main` from 1.4 onward.

## Global constraints

- Model ID `claude-haiku-5-5`, called through `@anthropic-ai/sdk` with structured outputs
  (`messages.parse` and Zod). No raw `fetch` to the API.
- Languages: the 13 codes of the language catalog (`src/shared/languages.ts`; see the language profile spec), three per user; levels exactly `native | advanced | intermediate | beginner`;
  default level `intermediate`.
- Input 1–500 characters after trimming.
- `DAILY_TRANSLATION_LIMIT` default 50, overridable per user by `user.daily_limit`;
  `BURST_LIMIT_PER_MINUTE` default 10. Day boundary is UTC midnight.
- Usage is recorded only after a successful translation; deleting history never restores quota.
- Email/password auth only when `NODE_ENV !== "production"`.
- Styling: Mantine theme and component props first; no CSS modules unless Mantine cannot express it.
- `src/server/**` never imports from `next/*`.
- Tests: no real model calls in `test` / `test:int` / CI. `.env.test` is committed and holds no
  secrets.
- Error shape: `{ error: "<code>", ...details }`, with status codes as in spec §9.

## Review focus

Inputs the spec implies but no happy-path test covers. Each line has a test assigned to its task.

1. **The model rewrites the user's text in the source language** (e.g. fixes a typo in
   `translations.es` when the input was Spanish). Expected: the root phrase keeps the user's
   original text, and the fix only appears as a correction. Test: Task 1.7,
   `createGroup keeps original input as root text`.
2. **Mixed or ambiguous input** ("hola, how are you?"), or the detected language disagrees with the
   only non-empty translation. Expected: the detected language becomes the root and all three
   phrases are saved. Test: Task 1.5, schema mapping accepts each of `es|en|fr` as detected; Task
   1.7, root lang equals `detectedLang` for each language.
3. **Quota at the UTC-midnight boundary**, with the reset time shown in the user's local time.
   Expected: 23:59:59 UTC counts toward today, 00:00:00 starts fresh, and `resetAt` is the next UTC
   midnight. Test: Task 1.6, `decide` boundary cases.
4. **Acting on someone else's group by id** (PATCH or DELETE). Expected: 404 and no change. Test:
   Task 1.8, repository integration test `update/delete scoped to owner`.
5. **Double submit** (double-click, or Ctrl+Enter while pending). Expected: one request; the button
   and shortcut are disabled while pending. Test: Task 1.7, `TranslateForm` component test.

---

## Phase 0: Accounts and credentials (off-clock, no code)

These are external accounts and keys, not product code, so they sit outside the 2-hour clock. All
code scaffolding is inside Phase 1. If you decide setup also counts as off-clock, move 1.1 here and
note it in the README.

### Task 0.1: Accounts and credentials — [x]

- [ ] **Anthropic:** create an API key and confirm `claude-haiku-5-5` is listed:
      `curl https://api.anthropic.com/v1/models/claude-haiku-5-5 -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01"`
- [ ] **Google Cloud:** create an OAuth 2.0 Client ID (type: web app). Authorized redirect URIs:
      `http://localhost:3000/api/auth/callback/google` and
      `https://<vercel-domain>/api/auth/callback/google` (add the second after 1.4).
- [ ] **Neon:** create the project and a `parlo` database, and copy the **pooled** connection string.
- [ ] **GitHub:** create the repo and push `main`.
- [ ] **Vercel:** import the repo (framework preset Next.js) without deploying yet; env vars are set
      in 1.4.
- [ ] Put the dev secrets in `.env.local` (gitignored).

---

## Phase 1: Casper submission (2h timebox)

Record the start time here: `2026-10-10 02:49 UTC`, and the stop time: `2026-10-10 04:15 UTC` (submitted after 1.7, plus the README and "Coming next"
placeholders; 1.8 and 1.9 continue after submission).

### Task 1.1: Tooling foundation — [x]

**Branch** `tooling-foundation` · **Model** Sonnet 5.5 · **Est.** 15m

**Scope:**
- Vitest with separate unit and integration projects.
- Env loading and validation.
- Docker Postgres with the dev and test databases.
- CI.
- npm scripts.

**Files:**
- Create:
  - `vitest.config.mts`: two projects. `unit` (`src/**/*.test.{ts,tsx}`, jsdom for `.tsx`).
    `int` (`src/**/*.int.test.ts`, node env, `globalSetup` runs migrations once Task 1.3 exists).
    It calls `loadEnvConfig(process.cwd())` from `@next/env`.
  - `src/test/setup.ts`: RTL `cleanup`, `@testing-library/jest-dom`, `matchMedia` polyfill for
    Mantine.
  - `src/test/render.tsx`: `renderWithProviders(ui)` wrapping `MantineProvider` (and
    `QueryClientProvider` once 1.2 exists).
  - `src/server/env.ts`: Zod schema over `process.env`, exported as `env`. Fields: `DATABASE_URL`,
    `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
    `ANTHROPIC_API_KEY`, `DAILY_TRANSLATION_LIMIT` (coerce int, default 50),
    `BURST_LIMIT_PER_MINUTE` (coerce int, default 10). Parsed lazily on first access so `next build`
    doesn't need runtime secrets.
  - `src/server/env.test.ts`
  - `docker-compose.yml`: `postgres:17`, port 5432, user and password `parlo`, volume, and
    `docker/init.sql` creating the `parlo_test` database.
  - `.env.test` (test DB URL, fixed `BETTER_AUTH_SECRET`, dummy Google and Anthropic values).
    (`.env.example` landed early, before Phase 1.)
  - `.github/workflows/ci.yml`: Node 24, `npm ci`, `npm run lint`, `npm run typecheck`,
    `npm test`, `npm run test:int` with a `postgres:17` service.
- Modify:
  - `package.json` scripts: `typecheck` (`tsc --noEmit`), `test` (`vitest run --project unit`),
    `test:int` (`vitest run --project int`), `test:all`, `db:up` (`docker compose up -d`).
  - `.gitignore`: add `!.env.example` and `!.env.test` after `.env*`.

**Tests** (`env.test.ts`): applies the defaults for the limits; coerces numeric strings; throws a
readable error naming the missing var.

**Acceptance:** `npm run db:up && npm test && npm run lint && npm run typecheck` all pass; CI is
green on the PR.

**Commits (suggested):**
- "Add Vitest with unit and integration projects"
- "Add validated env config"
- "Add Docker Postgres for development and tests"
- "Add CI workflow"

### Task 1.2: App shell and theme — [x]

**Branch** `app-shell` · **Model** Sonnet 5.5 · **Est.** 10m

**Scope:**
- Mantine and TanStack Query providers.
- Theme.
- `AppShell` with header, nav (Translate, History, Phrasebook, Profile) and a mobile burger.
- Placeholder pages.
- Remove the create-next-app boilerplate.

**Files:**
- Create:
  - `src/ui/theme.ts` (`createTheme`: primary color, radius, font)
  - `src/app/providers.tsx` (client: `MantineProvider`, `Notifications`, `QueryClientProvider`)
  - `src/ui/AppLayout.tsx`, `src/ui/NavLinks.tsx`, `src/ui/AppLayout.test.tsx`
  - `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/history/page.tsx`,
    `src/app/(app)/phrasebook/page.tsx`, `src/app/(app)/profile/page.tsx`
- Modify: `src/app/layout.tsx` (`ColorSchemeScript`, `mantineHtmlProps`, Mantine CSS imports,
  providers)
- Delete: create-next-app's `page.module.css` and `globals.css` content, plus unused `public/*.svg`.
- Deps: `@mantine/core @mantine/hooks @mantine/notifications @tabler/icons-react
  @tanstack/react-query`

**Tests:** `AppLayout` renders all four nav links; the active link matches the current path (mock
`usePathname`).

**Acceptance:** `npm run dev` shows the shell; mobile width shows the burger; tests pass.

### Task 1.3: Database and auth — [x]

**Branch** `database-auth` · **Model** Opus 5.5 · **Est.** 25m

**Scope:**
- Drizzle schema for **all** tables (spec §4) and the first migration.
- DB client.
- Better Auth (Google, plus email/password outside production).
- Sign-in page.
- `proxy.ts` redirect.
- Session helpers.
- Test DB global setup.

**Decision:** use the `pg` driver (`drizzle-orm/node-postgres`) in every environment, with Neon's
pooled URL in production. One code path, and it works on Vercel Fluid compute. Spec §2 reflects this.

**Files:**
- Create:
  - `drizzle.config.ts`
  - `src/server/db/schema.ts`: auth tables generated by `npx @better-auth/cli generate`, plus
    `phraseGroup`, `phrase`, `languageLevel`, `translationUsage`, `langEnum`, `levelEnum`, and the
    partial unique index on `phrase(group_id) where is_root`.
  - `src/server/db/client.ts` (`getDb()` singleton)
  - `src/server/db/migrations/*`
  - `src/server/auth/auth.ts`: `betterAuth({ database: drizzleAdapter(...), socialProviders: { google },
    emailAndPassword: { enabled: process.env.NODE_ENV !== "production" }, user: { additionalFields:
    { dailyLimit } } })`
  - `src/server/auth/session.ts`: `getSession(headers): Promise<{ userId: string } | null>`
  - `src/app/api/auth/[...all]/route.ts`
  - `src/server/http/responses.ts`: `jsonError(status, code, extra?)`, `withSession(handler)`,
    which returns 401 when there's no session and otherwise calls `handler(req, { userId, params })`.
  - `src/server/http/responses.test.ts`
  - `src/proxy.ts`: redirect unauthenticated page requests (not `/api/*`, `/sign-in` or static
    files) to `/sign-in`, using the session-cookie presence check Better Auth recommends for Next 16
    proxy.
  - `src/app/sign-in/page.tsx` (Google button; email/password form when not in production),
    `src/ui/UserMenu.tsx` (sign out)
  - `src/test/db.ts`: `resetDb()` truncates the app tables
  - `src/test/global-setup.int.ts`: runs migrations against `.env.test`
- Modify: `package.json` scripts `db:generate`, `db:migrate`, `db:studio`; `vitest.config.mts`
  (int `globalSetup`).
- Deps: `drizzle-orm pg better-auth zod`, plus dev deps `drizzle-kit @types/pg`.

**Interfaces produced:**
- `getDb(): NodePgDatabase<typeof schema>`
- `getSession(headers: Headers): Promise<{ userId: string } | null>`
- `withSession<P>(h: (req: Request, ctx: { userId: string; params: P }) => Promise<Response>)`
- `jsonError(status: number, error: string, extra?: Record<string, unknown>): Response`
- Types `Lang = "es" | "en" | "fr"` and `Level = "native" | "advanced" | "intermediate" | "beginner"`,
  exported from `src/server/db/schema.ts` (with `LANGS` and `LEVELS` arrays).

**Tests:**
- Unit: `withSession` returns 401 without a session and passes `userId` through with one;
  `jsonError` shape.
- Int: migrations apply cleanly, and the partial unique index rejects a second root in a group.

**Acceptance:** sign in locally with Google **and** with email/password; visiting `/` signed out
redirects to `/sign-in`; tests pass.

### Task 1.4: First deploy (walking skeleton) — [x]

Live at **https://parlo-flax.vercel.app**.

**Branch** `first-deploy` · **Model** Sonnet 5.5 · **Est.** 10m

**Scope:** retire the deployment risk early by getting the shell and Google sign-in live on Vercel
and Neon.

- [ ] Run `DATABASE_URL=<neon> npm run db:migrate` (from your machine; later this moves into the
      build or a CI step, see 2.4).
- [ ] Vercel env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET` (new random value),
      `BETTER_AUTH_URL=https://<domain>`, `GOOGLE_*`, `ANTHROPIC_API_KEY`.
- [ ] Add the production redirect URI to the Google OAuth client.
- [ ] Merge to `main`, then confirm the deploy and sign in with Google in production.
- [ ] Confirm the email/password form is **not** shown in production.
- Code changes only if the deploy needs them (e.g. `serverExternalPackages`); otherwise this task is
  config only and the branch can be skipped.

**Acceptance:** the production URL opens, Google sign-in works, the shell renders.

### Task 1.5: Translator (Haiku 5.5) — [x]

**Branch** `translator` · **Model** Opus 5.5 · **Est.** 15m

**Scope:**
- `Translator` port and the Haiku 5.5 adapter with structured outputs.
- Prompt builder.
- Fake translator for tests.
- Live smoke script.

**First step:** use the `claude-api` skill. Verify `messages.parse` with a Zod output format on
`claude-haiku-5-5`, and check what the 5.x thinking and effort defaults mean for latency (prefer
low effort, since translation is latency-sensitive). Record the findings in this task.

**Files:**
- Create:
  - `src/server/translation/types.ts`: `Translator`, `TranslateInput`, `TranslationResult`
  - `src/server/translation/schema.ts` + `.test.ts`: Zod output schema (spec §5)
  - `src/server/translation/prompt.ts` + `.test.ts`: `SYSTEM_PROMPT` constant,
    `buildUserMessage(input)`
  - `src/server/translation/haiku.ts` + `.test.ts`: `HaikuTranslator` with an injectable
    `Anthropic` client
  - `src/server/translation/fake.ts`: `FakeTranslator(result | (input) => result)`
  - `scripts/smoke-haiku.ts`, plus script `smoke:haiku` (`tsx --env-file=.env.local …`)
- Deps: `@anthropic-ai/sdk`, plus dev dep `tsx`.

**Interfaces produced:**
```ts
type Levels = Record<Lang, Level>;
interface TranslateInput { text: string; levels: Levels }
interface TranslationResult {
  detectedLang: Lang | "other";
  correction: { text: string; explanation: string } | null;
  translations: Record<Lang, string>;
  notes: string | null;
}
interface Translator { translate(input: TranslateInput): Promise<TranslationResult> }
class TranslationFailedError extends Error {}  // refusal, schema mismatch, API error after retries
```

**Tests:**
- Prompt:
  - the user message wraps the text in `<phrase>` delimiters and lists the levels;
  - the explanation language is the user's strongest level (ties go `es`, `en`, `fr`);
  - `SYSTEM_PROMPT` contains no per-user data, so it stays cacheable.
- Schema accepts each `detectedLang` value, including `"other"`, and rejects missing translations.
- `HaikuTranslator`, with a stubbed client:
  - maps the parsed output;
  - throws `TranslationFailedError` on `stop_reason: "refusal"`, a null parse and an `APIError`;
  - sends `model: "claude-haiku-5-5"`.

**Acceptance:** `npm run smoke:haiku "me late the train"` prints a sensible correction and three
translations; unit tests pass.

### Task 1.6: Usage limits — [x]

**Branch** `usage-limits` · **Model** Sonnet 5.5 · **Est.** 10m

**Files:**
- Create:
  - `src/server/usage/decide.ts` + `.test.ts`: the pure decision logic
  - `src/server/usage/limiter.ts`: `UsageLimiter` interface and `PostgresUsageLimiter` (one query
    with two `count(*) filter (...)` columns)
  - `src/server/usage/limiter.int.test.ts`
  - `src/app/api/usage/route.ts` + `.test.ts`

**Interfaces produced:**
```ts
type LimitDecision = { ok: true } | { ok: false; reason: "daily" | "burst"; resetAt: Date };
function decide(a: { todayCount: number; minuteCount: number; dailyLimit: number; burstLimit: number; now: Date }): LimitDecision;
function nextUtcMidnight(now: Date): Date;
interface UsageLimiter {
  check(userId: string): Promise<LimitDecision>;
  record(userId: string): Promise<void>;
  usage(userId: string): Promise<{ usedToday: number; dailyLimit: number; resetAt: Date }>;
}
```

**Tests:**
- `decide` returns:
  - ok under both limits;
  - daily when `todayCount >= dailyLimit` (the boundary is exactly equal);
  - burst when `minuteCount >= burstLimit`, with `resetAt = now + 60s`;
  - daily before burst when both apply.
- `nextUtcMidnight(23:59:59Z)` is the next day at 00:00Z, and `00:00:00Z` maps to the following
  midnight (**review focus 3**).
- Int:
  - `record` then `usage` counts 1;
  - rows from yesterday UTC aren't counted;
  - `user.daily_limit` overrides the env default.
- Route: 401 without a session; returns `{ usedToday, dailyLimit, resetAt }`.

### Task 1.7: Translate flow — [x]

**Branch** `translate-flow` · **Model** Sonnet 5.5 · **Est.** 20m

**Scope:**
- Phrase repository and `createGroup`.
- `POST /api/translations`.
- Translate page UI.
- `UsageBadge` in the header.

**Files:**
- Create:
  - `src/server/phrases/types.ts`: `PhraseGroupDTO`
  - `src/server/phrases/repository.ts`: `PhraseRepository` (`insertGroup`, `findById`, `list`,
    `update`, `delete`)
  - `src/server/phrases/repository.int.test.ts`
  - `src/server/phrases/service.ts` + `.test.ts`: `PhraseService.createGroup(userId, input,
    result)`, which is pure mapping plus a repository call
  - `src/server/container.ts`: wires the real implementations; routes import from here, and tests
    inject fakes.
  - `src/app/api/translations/route.ts` + `.test.ts`, `.int.test.ts` (one end-to-end test with a
    real DB and `FakeTranslator`)
  - `src/ui/translate/TranslateForm.tsx` + `.test.tsx`, `src/ui/translate/TranslationResult.tsx`,
    `src/ui/PhraseCard.tsx` + `.test.tsx`, `src/ui/CorrectionAlert.tsx` + `.test.tsx`,
    `src/ui/UsageBadge.tsx`
  - `src/ui/api.ts`: typed fetch helpers that throw `ApiError { status, body }`
- Modify: `src/app/(app)/page.tsx`, `src/ui/AppLayout.tsx` (`UsageBadge`)

**Interfaces produced:**
```ts
interface PhraseDTO { lang: Lang; text: string; isRoot: boolean; correctedFrom: string | null }
interface PhraseGroupDTO {
  id: string; createdAt: string; isFavorite: boolean; notes: string | null;
  correction: { text: string; explanation: string; accepted: boolean } | null;
  phrases: Record<Lang, PhraseDTO>;
}
```

**Route order:**
1. `withSession`
2. Zod-validate `{ text }` (trimmed 1–500)
3. `limiter.check`, which can return 429 with `Retry-After`
4. Load the levels (until 1.9 lands, default all to `intermediate`)
5. `translator.translate`: a `TranslationFailedError` returns 502; `"other"` returns 422
6. `service.createGroup` and `limiter.record`
7. 201

**Tests:**
- Service:
  - root lang equals `detectedLang` for each of `es|en|fr` (**review focus 2**);
  - `createGroup keeps original input as root text`, even when the model's same-language
    translation differs (**review focus 1**);
  - the correction is stored with `accepted: false`.
- Route (fakes):
  - 400 on whitespace-only and 501-character input;
  - 429 carries `Retry-After` and doesn't call the translator;
  - 502 records no usage;
  - 422 for `"other"`;
  - 201 shape.
- Int: the end-to-end POST persists one group, three phrases and one usage row.
- `TranslateForm`: Ctrl/⌘+Enter submits; the button is disabled and the shortcut ignored while
  pending, so there's exactly one request on double-click (**review focus 5**); the counter shows
  `n/500`.
- `CorrectionAlert` shows original vs suggestion and calls `onAccept`.
- `PhraseCard` marks the root and copies its text.

**Acceptance:** translating locally shows the detected badge, an optional correction, three cards
and notes; the usage badge increments; tests pass.

### Task 1.8: History and phrasebook — [ ]

> **Slice done (branch `phrasebook-favorites`):** the star on the translation result, `PATCH
> /api/phrase-groups/:id` with `{ isFavorite }`, `GET /api/phrase-groups?favorite=true`, and the
> Phrasebook page listing favorites. Still to do: history, search, paging, delete and "Use
> corrected".

**Branch** `history-phrasebook` · **Model** Sonnet 5.5 · **Est.** 15m

**Files:**
- Create:
  - `src/app/api/phrase-groups/route.ts` + `.test.ts`: GET with `favorite`, `q` (ILIKE over the
    group's phrases), `cursor` (`createdAt|id`) and `limit` (default 20, max 50)
  - `src/app/api/phrase-groups/[id]/route.ts` + `.test.ts`: PATCH `{ isFavorite?, acceptCorrection? }`,
    DELETE
  - `src/ui/LangSwitcher.tsx` + `.test.tsx`, `src/ui/GroupList.tsx` + `.test.tsx`
- Modify:
  - `src/server/phrases/service.ts`: `acceptCorrection(userId, id)` sets the root's `text` to the
    correction and `corrected_from` to the original, and returns 409 when there's nothing pending
  - `src/ui/translate/TranslationResult.tsx`: the favorite toggle and "Use corrected" call PATCH
  - `src/app/(app)/history/page.tsx`, `src/app/(app)/phrasebook/page.tsx` (with a search
    `TextInput`, debounced)

**Tests:**
- Repository int:
  - `update/delete scoped to owner`: another user's id changes nothing and returns not found
    (**review focus 4**);
  - cursor pagination has no duplicates or gaps across pages;
  - `q` matches text in any language of the group;
  - cascading delete removes the phrases.
- Service: `acceptCorrection` swaps the texts, then a second call is a conflict.
- Routes: 404 for a foreign id; 400 for an invalid body.
- `LangSwitcher` changes the shown phrase in `GroupList`; `GroupList` shows a root badge only on the
  root phrase.

**Acceptance:** history browses in ES, EN or FR; star, unstar and delete work; the phrasebook shows
only favorites and search filters it.

### Task 1.9: Language levels — [ ]

> Updated by the language profile work (1.11): the `language_level` table now also holds `region` and
> `position` (0 = native, set by default), `Levels` no longer exists (the translator takes a list of
> `ProfileLanguage`), and explanations always come in the native language. This task only adds editing
> of `level` for the two learning languages on top of that.

**Branch** `language-levels` · **Model** Sonnet 5.5 · **Est.** 10m

**Files:**
- Create:
  - `src/server/profile/repository.ts` + `.int.test.ts`: `getLevels(userId): Promise<Levels>`
    (defaults filled in) and `setLevels(userId, levels)` (upsert)
  - `src/app/api/profile/levels/route.ts` + `.test.ts`: GET and PUT
  - `src/ui/profile/LevelsForm.tsx` + `.test.tsx`
  - `src/ui/LevelsOnboardingNotice.tsx`: a notification on first visit when the user has no stored
    levels; GET returns `{ levels, isDefault }` to drive it
- Modify:
  - `src/app/api/translations/route.ts`: load the real levels
  - `src/app/(app)/profile/page.tsx`: the form plus today's usage

**Tests:**
- Int: getting levels with no rows returns all `intermediate`; set, then get, round-trips; a second
  set upserts.
- Route: PUT rejects an unknown lang or level.
- `LevelsForm` submits the selected values.
- The translate route passes the stored levels to the translator (fake records the input).

**Acceptance:** setting FR to beginner makes explanations simpler on FR input (check by hand).

### Task 1.10: Submission README — [x]

**Branch** `submission-notes` · **Model** Haiku 5.5 · **Est.** 5m

Rewrite `README.md` with:
- what Parlo is and why;
- the live URL;
- what works and what's incomplete;
- how to run it locally (`npm i`, `npm run db:up`, `npm run db:migrate`, `.env.local` from
  `.env.example`, `npm run dev`);
- how to run the tests;
- the architecture in brief, with links to the spec and plan.

Fill in the Phase 1 stop time above.

---

## Phase 2: Hardening (post-Casper)

Each task gets its own branch, and each is expanded before it starts.

- [ ] **2.1 Atomic rate limiting** (Opus 5.5): insert-if-under-limit in one statement, or advisory
      lock per user; concurrency int test with 20 parallel requests.
- [ ] **2.2 Prompt eval set** (Opus 5.5, `claude-api` skill `build-eval`): 30–50 tricky
      colloquial phrases across ES/EN/FR with expected corrections; grade with an LLM judge; track
      quality when the prompt or model changes.
      Seed cases from smoke runs:
      - "Ayer fuistes al cine sin mí": expect a correction to "fuiste". Haiku 5.5 catches it about
        3/10 at low effort and 2/4 at medium (medium is ~2x slower), and sometimes wrongly calls it
        the vosotros form. An earlier "medium" sample silently ran at low because of a bug, since
        fixed.
      - "I could of told you that": expect "could have".
      - "je suis excité pour la fête ce soir" once produced the correction "J'ai trop hâte *pour*
        la fête" (should be "hâte *de*"), so check that the correction text is itself correct.
      - "je suis excité pour la fête ce soir": a false friend; expect "j'ai hâte".
      - "il pleut des cordes, on reste à la maison ?": expect **no** correction (casual lowercase).
      - "Estoy hasta las narices de esperar": expect no correction, plus an idiom note.
- [ ] **2.3 Prompt caching check** (Sonnet 5.5): confirm `cache_read_input_tokens` > 0 on repeat
      calls, or that the system prompt is below the minimum cacheable size; log usage tokens.
- [~] **2.4 Migrations in the pipeline** (Sonnet 5.5).
      - [x] The CI `migrate` job runs `db:migrate` on push to `main` after `check` passes, using
            `DATABASE_URL` from the GitHub Environment `production` (Neon direct URL).
      - [ ] Neon preview branches for PRs.
      - Caveat: Vercel deploys independently of CI, so new code can go live a minute before its
        migration. Keep migrations backward compatible (expand, then contract), or gate production
        on CI checks in Vercel. Vercel env vars are
      currently set for **Production only**, so previews build but can't authenticate (Google rejects
      unregistered redirect URIs). Enabling previews needs a Neon branch per PR, a per-preview
      `BETTER_AUTH_URL` (`VERCEL_URL`), and a strategy for OAuth on previews (e.g. email/password
      enabled on previews only).
- [ ] **2.5 Playwright e2e for the critical path** (Sonnet 5.5): sign-in (dev email/password),
      translate with a mocked translator, history.
- [ ] **2.6 Observability** (Haiku 5.5): structured logs and an error-tracking integration.
- [ ] **2.7 Accessibility pass** (Sonnet 5.5): keyboard navigation, labels, contrast in both color
      schemes.

## Phase 3: Style variants

- [ ] **3.1** (Opus 5.5): extend the schema with `variants: { formal, friendly, slang }` per
      language, generated on demand (`POST /api/phrase-groups/:id/variants`) to keep the base call
      fast and cheap; stored in a `phrase_variant` table; tabs on each `PhraseCard`.

## Phase 4: Pronunciation

- [ ] **4.1** (Sonnet 5.5): start with browser `speechSynthesis` (free, no backend) with a
      per-language voice; a play button on `PhraseCard`.
- [ ] **4.2** (Opus 5.5): evaluate a hosted TTS provider for quality; cache the audio per phrase.

## Phase 5: Level-aware learning

- [ ] **5.1** (Opus 5.5): the explanation depth and vocabulary hints adapt per level; "explain more"
      on demand.
- [ ] **5.2** (Opus 5.5): suggest a user's level from their correction history.
- [ ] **5.3** (Sonnet 5.5): spaced-repetition review of phrasebook entries.
- [ ] **5.4** (Sonnet 5.5): profile setting for the explanation language: strongest language
      (default, today's behaviour) or the phrase's own language (immersion).

---

## Changelog

- 2026-10-09: plan created from the approved spec.
- 2026-10-10: 1.1 done. Vitest 5 needs `@types/node` ≥ 22 (bumped to 24); three Vitest projects
  (`unit` node, `ui` jsdom, `int` node) instead of two, so route tests get Node's `Request`/`Response`;
  `src/test/env-guard.test.ts` asserts tests run against `parlo_test`; CI also runs `next build`.
- 2026-10-10: 1.2 done on Mantine 9.7 and TanStack Query 5. Geist fonts kept via `next/font` CSS
  variables referenced from the Mantine theme (no CSS files left in the app). Color scheme follows the
  OS (`defaultColorScheme="auto"`). If `tsc` complains about `.next/types` after deleting routes,
  run `rm -rf .next`.
- 2026-10-10: 1.3 done (better-auth 1.7, drizzle-orm 0.45, drizzle-kit 0.31).
  - The npm `@better-auth/cli` stops at 1.4, so the auth tables were written by hand from
    better-auth 1.7's own `getAuthTables()` output.
  - Auth, DB and env are all lazy (`getAuth()`, `getDb()`, `getEnv()`), so builds need no secrets.
  - `src/server/db/migrations` is excluded from Biome.
  - Component tests render Mantine with `env="test"` (no transitions or portals).
  - Verified by hand: `dailyLimit` is rejected at sign-up (`FIELD_NOT_ALLOWED`).
  - If a regenerated migration conflicts with the test DB, drop and recreate its schema (it's
    disposable).
- 2026-10-10: CI fix: `typecheck` runs `next typegen` first, because `LayoutProps`/`RouteContext`
  globals are generated and don't exist in a fresh checkout. Local CI replay: `git archive <branch>`
  into a scratch dir, then run the CI steps there.
- 2026-10-10: 1.4 done.
  - Neon database is `neondb`. Migrations run from a laptop with the **direct** URL; Vercel uses the
    **pooled** URL with `sslmode=verify-full`.
  - Vercel env vars apply only to new deployments, so redeploy after changing them (the cause of a
    500 during the first deploy).
  - Google consent screen set to In production so reviewers can sign in.
- 2026-10-10: Casper submission at 04:15 UTC. History, Phrasebook and Profile pages show "Coming
  next" previews.

- 2026-10-20: 1.8 favorites slice done.
  - The star belongs to the whole group, not a language, so it keeps working once translations
    follow the user's preferred languages.
  - `GET /api/phrase-groups` only accepts `favorite=true` for now (400 otherwise) and returns every
    favorite without paging; 1.8 adds history, `q` and `cursor`.
  - The Phrasebook page reuses `TranslationResult`. `FavoriteButton` is keyed by group id so a new
    translation doesn't inherit the previous star.

- 2026-10-10: 1.7 done.
  - `buildNewGroup` drops a "correction" that equals the input.
  - `parseJson` turns invalid JSON or schema failures into 400s with `fields`.
  - Usage is refetched after every translate attempt (including 429s).
  - The jsdom test setup gained a `document.fonts` polyfill (Mantine's autosize Textarea).
  - Live: 201 in ~4.5 s with real Haiku; 422 for Italian with no usage recorded.
  - "Use corrected" and the favorite toggle are wired in 1.8.

- 2026-10-10: 1.6 done.
  - `PostgresUsageLimiter` takes an injectable clock, so the UTC-boundary tests need no waiting.
  - It runs one query: two `count(*) filter` columns plus a sub-select of `user.daily_limit`.
  - `src/server/container.ts` (the composition root) arrived here instead of 1.7; routes import
    `getUsageLimiter()` from it and tests mock the module.
  - Burst `resetAt` is a conservative now + 60s.

- 2026-10-10: prompt refinements after review.
  - Levels describe the *user* (never the phrase).
  - Corrections apply regardless of level, and common colloquial non-standard forms count as
    errors.
  - Explanations are always in the user's strongest language (an explicit system-prompt rule, since
    the model drifted to the phrase's language).
  - Effort is now a `HaikuTranslator` option (default `low`; `SMOKE_EFFORT=medium` in the smoke
    script).

- 2026-10-10: 1.5 done (`@anthropic-ai/sdk` 0.133).
  - Haiku 5.5 facts, from the official migration guide:
    - adaptive thinking is on by default (effort default `medium`), and thinking tokens count
      toward `max_tokens`;
    - `temperature`/`top_p`/`top_k` return a 400, and so does assistant prefill;
    - it can refuse (`stop_reason: "refusal"`), with no server-side fallback;
    - the minimum cacheable prompt is 512 tokens.
  - We use `messages.parse` with `zodOutputFormat`, `effort: "low"` and `max_tokens: 2048`.
  - Live smoke run: ~2–3 s per call (~5 s cold). It caught a false friend ("excité"), a calque
    ("me late") and idioms. A capitalization-only false positive was fixed in the prompt.
  - The smoke script is `.mts` (tsx needs ESM for top-level await). The system prompt is below
    512 tokens, so it isn't cached yet (see 2.3).
