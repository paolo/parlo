# History, Limits, Corrections and Review Mode Implementation Plan

> **For agentic workers:** Execute with superpowers:executing-plans (native, inline; the user chose this mode for
> Parlo). Steps use checkbox (`- [ ]`) syntax. Tick them as you go.

**Goal:** Let users browse, page through and delete their saved phrases, accept a suggested correction, keep their
data bounded with configurable limits, and study their Phrasebook with a flashcard Review mode.

**Architecture:** The `PhraseRepository` gains keyset paging, delete, pruning, a starred cap and accept-correction,
all behind the existing interface. One list endpoint serves History and the Phrasebook. The UI gets one shared
list component, an infinite-query hook and a framework-free review-session module driven by a thin view.

**Tech Stack:** Next.js 16, TypeScript, Drizzle + Postgres, Zod, Mantine, TanStack Query, Vitest + RTL, Biome.

**Spec:** [`docs/specs/2026-10-21-history-and-review-design.md`](../specs/2026-10-21-history-and-review-design.md)
(extends the two earlier specs; read all three).

**Branching:** one branch, `history-and-review` (it already holds the spec commits), atomic commits per step group,
one `git merge --no-ff` at the end ("Merge history and review mode") after the user approves. Same reasoning as the
language profile work: the tasks only make sense together and every merge to `main` deploys.

## Global Constraints

- Page size default 20, max 100. `HISTORY_LIMIT` default 500, `PHRASEBOOK_LIMIT` default 100, both positive integers
  from the environment.
- Starred groups are never pruned automatically. Pruning runs in the same transaction as the insert.
- Error shapes: `409 { error: "phrasebook_full", limit }`, `409 { error: "no_correction" }`,
  `409 { error: "already_accepted" }`, `400 invalid_input` for a bad `limit`, cursor or PATCH body.
- Accepting a correction and Review mode make no model calls and never touch the daily quota. Deleting never
  restores quota (existing rule).
- Every query stays scoped to the session user. No N+1 queries when listing (use `with: { phrases: true }`).
- `src/server/**` never imports from `next/*`. No new dependencies.
- UI: Mantine components first; interactions as in the spec. Inputs inherit the 16px theme defaults.
- Commits: one title line, imperative, capitalized, no prefix, no body, no trailers (`~/.claude/CLAUDE.md`).
- No real model calls in tests. Read `node_modules/next/dist/docs/` before touching Next.js APIs (`AGENTS.md`).
- Verify each task with `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:int` when it touches the
  DB (needs `npm run db:up`).

## Review Focus

1. Two groups created within the same millisecond but different microseconds, straddling a page boundary: no
   group skipped or repeated (Task 2). `created_at` is `timestamptz` with microsecond precision; a JS `Date` keeps
   only milliseconds.
2. A user already over `HISTORY_LIMIT` (limit lowered later) or whose stars exceed it: pruning removes only
   unstarred groups, never loops and never touches the newest (Task 3).
3. Accepting twice or double-clicking: the second call is `already_accepted`, and `corrected_from` still holds the
   originally typed text, not an earlier correction (Task 4).
4. Old groups lacking the viewer's language (the "Show in" language or the review practice language): shown with
   their original and marked in History, skipped and counted in Review (Tasks 6 and 8).
5. A group deleted in another tab, or a review session with a single card: delete of a missing group is treated as
   gone, not as an error toast (Task 6); "Again" on the last remaining card shows it again (Task 8).

---

### Task 1: Limit configuration

**Files:**
- Modify: `src/server/env.ts`, `src/server/env.test.ts`, `.env.example`, `src/server/phrases/types.ts`

**Interfaces:**
- Produces:
  - `Env.HISTORY_LIMIT: number` (default 500) and `Env.PHRASEBOOK_LIMIT: number` (default 100), same
    `z.coerce.number().int().positive()` style as the existing limits
  - `interface PhraseLimits { historyLimit: number; phrasebookLimit: number }` exported from `phrases/types.ts`

- [ ] **Step 1: Write failing tests** in `env.test.ts`: defaults are 500 and 100; `"HISTORY_LIMIT": "20"` and
  `"PHRASEBOOK_LIMIT": "5"` coerce to numbers; `HISTORY_LIMIT: "0"` and `PHRASEBOOK_LIMIT: "abc"` throw an error
  naming the variable.
- [ ] **Step 2:** `npx vitest run --project unit src/server/env` — expect FAIL.
- [ ] **Step 3:** Add both variables to the schema, the commented defaults to `.env.example`, and `PhraseLimits`.
- [ ] **Step 4:** Run the unit project and `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Add history and phrasebook limits to the configuration".

### Task 2: Paged group listing

**Files:**
- Create: `src/server/phrases/cursor.ts`, `src/server/phrases/cursor.test.ts`
- Modify: `src/server/phrases/types.ts`, `src/server/phrases/repository.ts`, `src/server/phrases/repository.int.test.ts`,
  `src/app/api/phrase-groups/route.ts`, `src/app/api/phrase-groups/route.test.ts`, the container mocks in other
  route tests that stub `listFavorites`, `docs/specs/2026-10-21-history-and-review-design.md` §3

**Interfaces:**
- Produces:
  - `encodeCursor(position: { createdAt: string; id: string }): string` and
    `decodeCursor(cursor: string): { createdAt: string; id: string } | null` (`null` when malformed). `createdAt`
    is the **full-precision** timestamp text from Postgres, not a `Date` (Review Focus 1).
  - `interface PhrasePage { items: PhraseGroupDTO[]; nextCursor: string | null }` and, on `PhraseRepository`,
    `listGroups(userId: string, options: { favorite?: boolean; limit: number; cursor?: string }): Promise<PhrasePage>`
    replacing `listFavorites`
  - `GET /api/phrase-groups?favorite=true&limit=20&cursor=…` → `200 { items, nextCursor, limit }` where `limit`
    is the cap that applies to that list (`HISTORY_LIMIT`, or `PHRASEBOOK_LIMIT` with `favorite=true`); a bad
    `limit` (not 1 to 100) or an undecodable cursor → `400 invalid_input`

- [ ] **Step 1: Write failing tests.** Cursor: encode then decode round-trips; decode of `"garbage"` and of valid
  base64url that is not the expected JSON returns `null`. Repository (int): three pages of 2 over 5 groups return
  all 5 once, newest first, with `nextCursor` null on the last; **two groups whose `created_at` differ only by
  microseconds (set with raw SQL) at a page boundary are neither skipped nor repeated** (Review Focus 1); other
  users' groups never appear; `favorite: true` returns only starred groups with the same paging. Route: default
  limit 20 reaches the repository; `limit=0`, `limit=101`, `limit=x` and `cursor=garbage` are 400 and do not call
  it; `favorite=true` passes `favorite: true`; the response carries the right `limit` for each list; 401 without a
  session.
- [ ] **Step 2:** Run `npx vitest run --project unit src/server/phrases src/app/api/phrase-groups` and
  `npm run test:int -- phrases` — expect FAIL.
- [ ] **Step 3:** Implement. Keyset condition `(created_at, id) < (cursor)` on the existing
  `(user_id, created_at desc, id desc)` index; fetch `limit + 1` rows to know whether another page exists; select
  the raw timestamp as text for the cursor (a `sql` extra on the relational query or a second narrow select —
  builder's choice). The repository gets its limits in Task 3; the route reads `getEnv()` for the response `limit`.
  Remove `listFavorites` and update every caller. Add the `limit` field to spec §3.
- [ ] **Step 4:** Run unit, int and `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Page through saved phrase groups with a cursor".

### Task 3: Delete, pruning and the phrasebook cap

**Files:**
- Modify: `src/server/phrases/types.ts`, `src/server/phrases/repository.ts`, `src/server/container.ts`,
  `src/server/phrases/repository.int.test.ts`, `src/app/api/phrase-groups/[id]/route.ts` and its test,
  `src/app/api/translations/route.int.test.ts` (constructor change only)

**Interfaces:**
- Consumes: `PhraseLimits`, `getEnv()`.
- Produces:
  - `new DrizzlePhraseRepository(db: Db, limits: PhraseLimits)`; the container passes
    `{ historyLimit: HISTORY_LIMIT, phrasebookLimit: PHRASEBOOK_LIMIT }`
  - `PhraseRepository.deleteGroup(userId: string, id: string): Promise<boolean>` (false when missing, not the
    caller's, or a malformed id)
  - `class PhrasebookFullError extends Error { readonly limit: number }` (in `types.ts`); `setFavorite` throws it
    when starring an unstarred group while the user already has `phrasebookLimit` starred groups
  - `insertGroup` prunes: after inserting, delete the user's oldest **unstarred** groups until their total is at
    most `historyLimit` or only starred groups remain
  - `DELETE /api/phrase-groups/:id` → `204`, or `404 { error: "not_found" }`; `PATCH` with `isFavorite` →
    `409 { error: "phrasebook_full", limit }` on `PhrasebookFullError`

- [ ] **Step 1: Write failing tests.** Int: `deleteGroup` removes the owner's group and returns true, returns false
  for a stranger's group and for `"not-a-uuid"` and removes nothing; with `historyLimit: 3` saving a 4th group
  removes the oldest unstarred one and keeps the newest three; **a starred oldest group survives while the oldest
  unstarred goes instead**; with every group starred and over the limit nothing is deleted and no error is thrown
  (Review Focus 2); with `phrasebookLimit: 2` the 3rd star throws `PhrasebookFullError` with `limit: 2`, while
  re-starring a starred group and unstarring both succeed; pruning one user never touches another user's groups.
  Route: `DELETE` → 204 and 404 (repository stubbed); `PATCH { isFavorite: true }` → 409 with the limit; 401.
- [ ] **Step 2:** Run unit and `npm run test:int -- phrases` — expect FAIL.
- [ ] **Step 3:** Implement. Pruning inside the `insertGroup` transaction; the starred count check is best effort
  (two parallel stars may overshoot by one; acceptable, note it in the code comment's *why*).
- [ ] **Step 4:** Run `npm run test:all` and `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Add deleting, history pruning and the phrasebook cap".

### Task 4: Accept a correction

**Files:**
- Modify: `src/server/phrases/types.ts`, `src/server/phrases/repository.ts`, `src/server/phrases/repository.int.test.ts`,
  `src/app/api/phrase-groups/[id]/route.ts`, `src/app/api/phrase-groups/[id]/route.test.ts`

**Interfaces:**
- Produces:
  - `PhraseRepository.acceptCorrection(userId: string, id: string): Promise<PhraseGroupDTO | null>` (null when the
    group is missing, not the caller's or the id is malformed); throws
    `class CorrectionNotAcceptableError extends Error { readonly code: "no_correction" | "already_accepted" }`
  - In one transaction: root `corrected_from` ← its current text, root `text` ← `correction_text`,
    `correction_accepted` ← true; other phrases untouched
  - `PATCH /api/phrase-groups/:id` body is **exactly one of** `{ isFavorite: boolean }` or
    `{ acceptCorrection: true }` (strict objects in a union); the correction errors map to
    `409 { error: code }`; unknown, empty or combined bodies and `{ acceptCorrection: false }` are 400

- [ ] **Step 1: Write failing tests.** Int: after accepting, the root's `text` is the correction and `correctedFrom`
  the typed text, the other two phrases are unchanged, `correction.accepted` is true; a second accept throws code
  `already_accepted` and **the root text and `correctedFrom` are unchanged** (Review Focus 3); a group saved without
  a correction throws `no_correction`; a stranger's group and a malformed id return null; a failing transaction
  leaves the group untouched. Route: `{ acceptCorrection: true }` returns 200 with the group and calls only
  `acceptCorrection`; `{ isFavorite: true }` still works; `{}`, `{ isFavorite: true, acceptCorrection: true }`,
  `{ acceptCorrection: false }` and `{ other: 1 }` are 400; both 409 codes; 404 when null.
- [ ] **Step 2:** Run unit and `npm run test:int -- phrases` — expect FAIL.
- [ ] **Step 3:** Implement with a `select … for update` (or a conditional update) on the group row inside the
  transaction so a double click cannot apply twice.
- [ ] **Step 4:** Run `npm run test:all` and `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Accept a suggested correction".

### Task 5: Client data layer and the accept button

**Files:**
- Modify: `src/ui/queries.ts`, `src/ui/errors.ts` + `errors.test.ts`, `src/ui/CorrectionAlert.tsx` + `.test.tsx`,
  `src/ui/translate/TranslationResult.tsx` + `.test.tsx`, `src/ui/phrasebook/PhrasebookView.tsx` and its test
  (only to keep them compiling and passing), `src/test/fixtures.ts`

**Interfaces:**
- Produces:
  - `queryKeys.history = ["phrase-groups", { favorite: false }] as const` (the existing `favorites` key stays)
  - `usePhraseGroups(options: { favorite: boolean })`: `useInfiniteQuery` over
    `GET /api/phrase-groups?favorite=…&limit=20&cursor=…`, pages typed `{ items: PhraseGroupDTO[]; nextCursor: string | null; limit: number }`,
    `getNextPageParam` = `nextCursor ?? undefined`
  - `useAllFavorites()`: one query for `GET /api/phrase-groups?favorite=true&limit=100`, replaces `useFavorites`
  - `useDeleteGroup()`: DELETE `/api/phrase-groups/:id` taking the id; treats a 404 as success; invalidates
    `queryKeys.phraseGroups`
  - `useAcceptCorrection()`: PATCH `{ acceptCorrection: true }` taking the id, returning `{ group }`; invalidates
    `queryKeys.phraseGroups`
  - `errorMessage` adds `phrasebook_full` ("Your phrasebook is full (<limit>). Remove one to add another.") and
    `already_accepted` / `no_correction` ("That correction was already applied." / "There is no correction to
    apply.")
  - `CorrectionAlert` title is "Correction applied" when `correction.accepted` is true (button already hidden then)
  - `TranslationResult` wires "Use corrected": it keeps `accept.data?.group ?? group` as the group it displays (the
    same pattern as `FavoriteButton`), shows the root card with the corrected text, passes `accepting`, and shows a
    red notification on error

- [ ] **Step 1: Write failing tests.** `errorMessage` for the three new codes (the limit appears in the first).
  `CorrectionAlert`: with `accepted: true` the title reads "Correction applied" and there is no button.
  `TranslationResult` (mock `fetch`): clicking "Use corrected" sends `PATCH /api/phrase-groups/g1` with
  `{ acceptCorrection: true }`, then the root card shows the corrected text and the alert says "Correction
  applied" with the original still struck through and no button; on a 409 the button stays and an error
  notification is shown.
- [ ] **Step 2:** Run `npm test` — expect FAIL.
- [ ] **Step 3:** Implement. Replace `useFavorites` users (`PhrasebookView`) with `usePhraseGroups({ favorite: true })`
  flattening `data.pages` for now (Task 7 reworks that view).
- [ ] **Step 4:** Run `npm test` and `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Wire up accepting corrections in the translate result".

### Task 6: History page

**Files:**
- Create: `src/ui/history/PhraseGroupList.tsx` + `.test.tsx`, `src/ui/history/HistoryView.tsx` + `.test.tsx`
- Modify: `src/ui/phrases.ts` + `src/ui/phrases.test.ts`, `src/app/(app)/history/page.tsx`

**Interfaces:**
- Consumes: `usePhraseGroups`, `useDeleteGroup`, `useProfile`, `TranslationResult`, `PhraseCard`,
  `FavoriteButton`, `LangLabel`, `ProfileGate`.
- Produces:
  - `pickPhrase(group: PhraseGroupDTO, lang: Lang): { phrase: PhraseDTO; fallback: boolean }` in `src/ui/phrases.ts`
    (the phrase in `lang`, else the root with `fallback: true`)
  - `PhraseGroupList({ favorite, showIn, empty, note }: { favorite: boolean; showIn: Lang | "all"; empty: ReactNode; note?: (limit: number) => ReactNode })`:
    loads with `usePhraseGroups`, "Load more" while a next page exists, `empty` when there are no items, `note`
    rendered with the response's `limit`
  - Each group: date, delete button with a confirmation (Mantine `Modal` or `Popover`, no new dependency);
    `showIn === "all"` renders `TranslationResult`; a language renders the `PhraseCard` for `pickPhrase`, the star
    button, and a "No <language> version, showing the original" hint when `fallback`
  - `HistoryView`: heading text, a `SegmentedControl` "Show in": All plus the user's profile languages (flag +
    name via `LangLabel`), the empty state "Nothing here yet. Translate something and it will show up." with a
    link to Translate, and the note "Keeps your last <limit> phrases. Starred phrases stay."

- [ ] **Step 1: Write failing tests.** `pickPhrase` returns the requested phrase, and the root with
  `fallback: true` when the group lacks the language. `PhraseGroupList` (mock `fetch` by URL): shows the first
  page, "Load more" fetches the next with the cursor and disappears when `nextCursor` is null; deleting asks for
  confirmation, sends `DELETE`, and the item disappears; **a 404 on delete also removes the item without an error
  notification** (Review Focus 5); cancelling the confirmation sends nothing. `HistoryView`: switching "Show in"
  to French shows only French texts and marks a legacy group that has no French phrase with its original and the
  hint; the empty state and the limit note render.
- [ ] **Step 2:** Run `npm test` — expect FAIL.
- [ ] **Step 3:** Implement; the history page is `ProfileGate` around `HistoryView` (`ComingNext` is no longer used
  by it).
- [ ] **Step 4:** Run `npm test`, `npm run typecheck`, `npm run lint` — expect PASS.
- [ ] **Step 5:** Commit "Add the history page".

### Task 7: Phrasebook on the shared list, with a Review entry

**Files:**
- Modify: `src/ui/phrasebook/PhrasebookView.tsx` + `.test.tsx`

**Interfaces:**
- Consumes: `PhraseGroupList`, `usePhraseGroups`, `useProfile`.
- Produces: `PhrasebookView` renders the shared list (`favorite: true`, `showIn` "all" with the same selector as
  History), a **Review** button linking to `/phrasebook/review` that is disabled while the first page is empty or
  loading, the existing empty-state text ("You haven't starred anything yet. Star a translation to keep it
  here.") with its "Go to Translate" link, and the note "Holds up to <limit> starred phrases."

- [ ] **Step 1: Write failing tests** (mock `fetch` by URL, `/api/profile` included): starred groups render with
  "Load more" paging; the Review button is a link to `/phrasebook/review` when there are items and disabled with
  none; the empty state and limit note render; a refused star (409 `phrasebook_full`) elsewhere is covered in
  Task 5, so here only the list behaviour.
- [ ] **Step 2:** Run `npm test` — expect FAIL.
- [ ] **Step 3:** Implement, reusing the show-in selector from `HistoryView` (extract a small shared component if
  that avoids duplication).
- [ ] **Step 4:** Run `npm test`, `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Page the phrasebook and link it to review mode".

### Task 8: Review session logic

**Files:**
- Create: `src/ui/review/session.ts`, `src/ui/review/session.test.ts`

**Interfaces:**
- Consumes: `orderPhrases` (`src/ui/phrases.ts`), `PhraseGroupDTO`, `Lang`.
- Produces:
  - `interface ReviewCard { id: string; front: PhraseDTO; back: PhraseDTO[] }` (`back` = the group's other
    phrases in profile order, root first as `orderPhrases` returns)
  - `buildCards(groups: PhraseGroupDTO[], practice: Lang, profileLangs: Lang[]): { cards: ReviewCard[]; skipped: number }`
    (a group without a `practice` phrase is skipped and counted)
  - `class ReviewSession` with `constructor(cards: ReviewCard[], random?: () => number)` (default `Math.random`;
    shuffles once with Fisher–Yates), `get current(): ReviewCard | null`, `get finished(): boolean`,
    `get total(): number`, `get done(): number` (cards graded "Got it"), `gotIt(): void`, `again(): void`
    (re-queues the current card after 3 others, or at the end when fewer than 3 remain), and
    `summary(): { firstTry: number; retried: ReviewCard[] }` (retried = cards that needed more than one try)

- [ ] **Step 1: Write failing tests.** `buildCards`: the front is the practice-language phrase, the back holds the
  other two in profile order, a legacy es/en/fr group with practice `pt` is skipped and counted (Review Focus 4).
  `ReviewSession` with a fixed `random`: the same seed gives the same order; every card appears until graded "Got
  it" and then `finished` is true; "Again" on the first of 5 cards shows it again after exactly 3 other cards;
  "Again" with 2 cards left puts it at the end; **a single card graded "Again" is shown again** (Review Focus 5);
  `done` and `total` track progress; `summary` counts first-try successes and lists the retried cards once each.
- [ ] **Step 2:** `npx vitest run --project unit src/ui/review` — expect FAIL.
- [ ] **Step 3:** Implement as plain TypeScript with no React imports.
- [ ] **Step 4:** Run the unit project and `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Add the review session logic".

### Task 9: Review mode page

**Files:**
- Create: `src/app/(app)/phrasebook/review/page.tsx`, `src/ui/review/ReviewView.tsx` + `.test.tsx`

**Interfaces:**
- Consumes: `useAllFavorites`, `useProfile`, `buildCards`, `ReviewSession`, `LangLabel`, `ProfileGate`.
- Produces: `ReviewView` with a practice-language `SegmentedControl` over the user's languages defaulting to the
  profile's second language (position 1), changing it restarts the session; the front card, **Reveal**, then
  **Got it** and **Again**; a progress line ("<done> of <total>"); the skipped line ("3 phrases skipped: no
  French version"); the summary screen (first-try count, the retried phrases, **Practice again** with a new
  shuffle and **Back to phrasebook** linking to `/phrasebook`); the empty state "Nothing to review yet. Star some
  translations first." with a link to Translate. The page is `ProfileGate` around `ReviewView`. The session lives
  in component state (a `ReviewSession` held in `useState`/`useRef` plus a render counter); nothing is stored or
  sent.

- [ ] **Step 1: Write failing tests** (mock `fetch` for `/api/profile` with pt/en/fr and `/api/phrase-groups`
  with starred groups; pass a seeded random through a prop or module mock): the session starts in the second
  language; the front text shows and the other versions appear only after Reveal; "Got it" advances and the
  progress updates; "Again" shows the card again later; finishing shows the summary with the right counts and
  "Practice again" starts a new session; switching the practice language restarts it; skipped groups produce the
  skipped line; no starred groups shows the empty state; no request other than the profile and favorites fetch is
  ever made.
- [ ] **Step 2:** Run `npm test` — expect FAIL.
- [ ] **Step 3:** Implement the view and the page.
- [ ] **Step 4:** Run `npm test`, `npm run typecheck`, `npm run lint` — expect PASS.
- [ ] **Step 5:** Commit "Add review mode".

### Task 10: Documentation and manual check

**Files:**
- Modify: `docs/plans/2026-10-09-parlo-plan.md` (progress row and a note under 1.8 that History, delete and accept
  correction are done by this work), `README.md` (History, Phrasebook and Review in the "What works" and
  "What's incomplete" lists, the two new variables), `.env.example` if Task 1 missed anything

- [ ] **Step 1:** Update the living plan: add row `1.12 History, limits, corrections and review | history-and-review |
  Opus 5.5 / Sonnet 5.5 | [x] [plan](2026-10-21-history-and-review-plan.md)`; in 1.8 note that history listing,
  delete and accept-correction are delivered there; update the README accordingly.
- [ ] **Step 2:** Run `npm run lint && npm run typecheck && npm run test:all && npm run build` — all pass.
- [ ] **Step 3: Manual check** with `npm run dev`: translate several phrases (a real key is fine), accept one
  correction and see the root card change, star a few, open History and "Load more" (temporarily set
  `HISTORY_LIMIT=3` and `PHRASEBOOK_LIMIT=2` in `.env.local` to see pruning and the full-phrasebook message, then
  remove them), delete a phrase, run a Review session in French at a phone-sized window. If a browser cannot be
  driven, say so in the final report instead of claiming it was checked.
- [ ] **Step 4:** Commit "Record history and review mode in the plan". Merge to `main` with
  `git merge --no-ff history-and-review -m "Merge history and review mode"` **only after the user approves.**
