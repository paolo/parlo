# Applied Corrections, Recent Phrases and Saved Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrections are applied in place with a morph and a Corrected/Suggestion pill that can revert them; the
Phrasebook lists Saved and the last 7 days; "Favorite" becomes "Saved" with a bookmark; the bookmark works while the
answer is still streaming.

**Architecture:** The server stores a group with its correction already applied and exposes one idempotent
`PATCH { correctionApplied }`. The translation route awaits the insert (beside the usage record) before `done`, and
trims history afterwards with `after()`. On the client a pure `withCorrection` helper derives what to show for an
optimistic apply/revert, a pure `diffChars` drives a `MorphText` animation in the root `PhraseCard`, and a
`CorrectionPill` with a Mantine `Popover` replaces `CorrectionAlert`. The Phrasebook's All tab becomes Recent via a
`recent=true` filter.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/` before route code), React, Mantine v9, CSS Modules,
TanStack Query, Drizzle + Postgres, Vitest + Testing Library, Biome, Tabler icons.

**Spec:** `docs/specs/2026-11-11-corrections-and-recent-design.md`

## Branch

Everything is built on `corrections-and-recent` (it holds the spec and this plan), one commit per task, merged into
`main` with `--no-ff` only after the author says so.

## Progress

- [ ] 1. Store corrections applied; set them applied or not
- [ ] 2. `done` after the save, trim after the response, `save_failed`
- [ ] 3. Recent filter and the Saved / Recent Phrasebook
- [ ] 4. Saved and the bookmark everywhere; Practice without Recent
- [ ] 5. Bookmark taps while the answer streams
- [ ] 6. Character diff and `MorphText`
- [ ] 7. Corrected / Suggestion pill replaces the correction box

## Global Constraints

- Tokens only: `var(--parlo-*)`, no hex, no new colours; a new value goes into `tokens.css` first.
- Everything pressable is a pill with at least a 44px hit area; icons are Tabler at stroke 1.8; no emoji.
- Phrase elements keep `lang` and `dir="auto"`. All motion respects `prefers-reduced-motion` (swap instantly).
- Motion uses the existing tokens: `--parlo-dur-strike` (550ms), `--parlo-dur-pop` (350ms), `--parlo-ease-spring`,
  `--parlo-ease-draw`.
- No schema change: `isFavorite` means saved; code identifiers, query keys, API fields and the `favorite` query
  parameter keep their names. Only user-facing copy says "saved".
- Recent window: 7 days, a constant `RECENT_DAYS = 7` in `src/shared/` (not an env variable).
- The history trim never runs before `done` is sent.
- Commit titles: one imperative, capitalized line, no prefix, no body, no trailers (user's CLAUDE.md).
- Verify with `npm run lint`, `npm run typecheck`, `npm test` before each commit; `npm run test:int` for Tasks 1–3.

## Review Focus

1. Double taps on Keep what I typed / Use the correction, or a revert racing an apply: the server ends in the last
   requested state and never errors on a repeat (Task 1: idempotence test; Task 7: rollback test).
2. A tap on the bookmark before `done`, then a second tap before `done`: no request at all (Task 5).
3. A save that fails after the cards are shown: the cards stay, no bookmark, one notification (Task 2).
4. Phrases saved before this change with an un-accepted correction show Suggestion and can be applied (Task 7).
5. A stored practice preference of `"recent"` after the source is removed: Starter is dealt, no crash (Task 4).

---

### Task 1: Store corrections applied; set them applied or not

**Files:**
- Modify: `src/server/phrases/types.ts` (`NewPhraseGroup`, `PhraseRepository`, `CorrectionNotAcceptableError`)
- Modify: `src/server/phrases/service.ts` (`buildNewGroup`, `describeNewGroup`)
- Modify: `src/server/phrases/repository.ts` (`insertGroup`, `acceptCorrection` → `setCorrectionApplied`)
- Modify: `src/app/api/phrase-groups/[id]/route.ts`
- Modify: `src/ui/errors.ts` (drop `already_accepted`)
- Test: `src/server/phrases/service.test.ts`, `src/server/phrases/repository.int.test.ts`,
  `src/app/api/phrase-groups/[id]/route.test.ts`

**Interfaces:**
- Produces:
  - `NewPhraseGroup.correction: { text: string; explanation: string; applied: boolean } | null`
  - `NewPhraseGroup.phrases: { lang: Lang; text: string; isRoot: boolean; correctedFrom: string | null }[]`
  - `PhraseRepository.setCorrectionApplied(userId: string, id: string, applied: boolean): Promise<PhraseGroupDTO | null>`
    (replaces `acceptCorrection`); throws `CorrectionNotAcceptableError("no_correction")`.
  - `CorrectionNotAcceptableError.code: "no_correction"` only.
  - `PATCH /api/phrase-groups/:id` body: `{ isFavorite: boolean } | { correctionApplied: boolean }` (strict);
    200 `{ group }`, 404 `not_found`, 409 `no_correction`.

- [ ] **Step 1: Write the failing tests**
  - `service.test.ts` › `buildNewGroup` › "applies a correction: the root holds the corrected text and keeps the
    typed one": typed `"que hora es"`, correction `"¿Qué hora es?"` → root `{ text: "¿Qué hora es?", correctedFrom:
    "que hora es" }`, `correction.applied === true`; other phrases have `correctedFrom: null`.
  - "treats a correction equal to the typed text as none" (existing trim rule) → `correction: null`, root text typed.
  - `describeNewGroup` › "describes an applied correction as accepted" → `correction.accepted === true`, root
    `correctedFrom === "que hora es"`.
  - `repository.int.test.ts`: replace the `acceptCorrection` block with `setCorrectionApplied`:
    "stores a group whose correction was applied" (insert → `correction.accepted`, root text and `correctedFrom`);
    "reverts to the typed text and applies again" (false → root text typed, `correctedFrom` null, `accepted`
    false; true → back); "returns the group unchanged when it already has that state" (both directions, no throw);
    "ends in the last requested state when two requests race" (`Promise.all([apply false, apply false])`);
    keep "refuses a group saved without a correction" and "returns null for a stranger's group and a malformed id".
  - `[id]/route.test.ts`: "sets a correction applied or not" (`{ correctionApplied: false }` calls
    `setCorrectionApplied("u1", id, false)`), "returns 409 no_correction", "rejects `{ acceptCorrection: true }`
    with 400".

- [ ] **Step 2: Run** `npx vitest run src/server/phrases src/app/api/phrase-groups` and `npm run test:int` — expect
  the new tests to FAIL.

- [ ] **Step 3: Implement.** `buildNewGroup` puts the correction in the root and sets `applied: true`; update its doc
  comment (the root no longer always keeps the typed text). `insertGroup` writes `correctionAccepted` from
  `correction.applied` and each phrase's `correctedFrom`. Bundle groups pass `correctedFrom: null`.
  `setCorrectionApplied` keeps the `FOR UPDATE` row lock; when the state already matches it returns `findById`;
  apply sets root `{ text: correctionText, correctedFrom: root.text }`, revert sets
  `{ text: root.correctedFrom, correctedFrom: null }`. Remove `already_accepted` from `errors.ts` and its test.
  `useAcceptCorrection` in `queries.ts` becomes `useSetCorrectionApplied()` with variables
  `{ id: string; applied: boolean }` (used in Task 7; keep `TranslationResult` compiling by calling it with
  `applied: true` until then).

- [ ] **Step 4: Run** the same commands — expect PASS; then `npm run lint && npm run typecheck && npm test`.

- [ ] **Step 5: Commit** — `git commit -m "Store corrections applied and let them be reverted"`

---

### Task 2: `done` after the save, trim after the response, `save_failed`

**Files:**
- Modify: `src/server/phrases/types.ts`, `src/server/phrases/repository.ts` (`pruneHistory` public, out of `insertGroup`)
- Modify: `src/server/translation/events.ts`, `src/app/api/translations/route.ts`
- Modify: `src/ui/translateStream.ts`, `src/ui/translate/TranslateView.tsx`, `src/ui/translate/TranslationResult.tsx`
- Test: `src/app/api/translations/route.test.ts`, `src/server/phrases/repository.int.test.ts`,
  `src/ui/translateStream.test.ts`, `src/ui/translate/TranslateView.test.tsx` (create)

**Interfaces:**
- Produces:
  - `PhraseRepository.pruneHistory(userId: string, keepId: string): Promise<void>` (public; `insertGroup` no longer
    prunes; `favoriteBundleGroup` keeps pruning inside its own transaction).
  - `TranslationEvent` error variant: `{ type: "error"; error: "translation_failed" | "save_failed" }`.
  - `streamTranslation` throws `ApiError(502, { error: "save_failed" })` on that line.
  - `TranslationResult` prop `unsaved?: boolean` — hides the bookmark (no pill actions either).

- [ ] **Step 1: Write the failing tests**
  - Route: replace "does not wait for the write…" with "sends done only once the group is stored" (hold
    `insertGroup`; read the body with a 50ms race — no `done` yet; resolve; `done` arrives).
  - Route: replace "still answers 201 when the write fails" with "ends with save_failed when the write fails, and
    logs it" (last line `{ type: "error", error: "save_failed" }`, `limiter.record` still called, logged
    `"Saving a translation failed"`).
  - Route: "trims history after the response" (`pruneHistory` not called before `done`; called with
    `("u1", group.id)` from `background`); "a failed trim only logs" (`"Trimming history failed"`).
  - Repository int: move the "history pruning" tests to call `insertGroup` then `pruneHistory`; add "insertGroup
    alone deletes nothing over the limit".
  - `translateStream.test.ts`: "throws save_failed when the save fails".
  - `TranslateView.test.tsx`: "keeps the cards and warns when the translation could not be saved" (stream:
    detected, three translations, save_failed → the three phrases still shown, no "Save" button, a notification
    titled "Couldn't save this translation" with message "It won't be in your phrasebook.").

- [ ] **Step 2: Run** `npx vitest run src/app/api/translations src/ui/translateStream.test.ts src/ui/translate` — FAIL.

- [ ] **Step 3: Implement.** In the route, `await Promise.all([timer.time("save", () => insertGroup(stored)),
  timer.time("record", () => limiter.record(...))])`, catching the insert error separately so the record still
  completes; then `after(pruneHistory(userId, stored.id).catch(log))`; then `done`. In `TranslateView`, when
  `translate.error` is an `ApiError` with code `save_failed`, keep showing
  `partialGroup(translate.variables, translate.progress)` with `unsaved` and show the notification (not the generic
  "Couldn't translate").

- [ ] **Step 4: Run** the same tests, `npm run test:int`, lint, typecheck, `npm test` — PASS.

- [ ] **Step 5: Commit** — `git commit -m "Send the stored group only once it is saved and trim history afterwards"`

---

### Task 3: Recent filter and the Saved / Recent Phrasebook

**Files:**
- Create: `src/shared/recent.ts` (`export const RECENT_DAYS = 7`)
- Modify: `src/server/phrases/types.ts`, `src/server/phrases/repository.ts` (`listGroups` `since`)
- Modify: `src/app/api/phrase-groups/route.ts` (`recent` param)
- Modify: `src/ui/queries.ts` (`usePhraseGroups`), `src/ui/history/PhraseGroupList.tsx`,
  `src/ui/phrasebook/PhrasebookView.tsx`
- Test: `repository.int.test.ts`, `src/app/api/phrase-groups/route.test.ts`, `src/ui/phrasebook/PhrasebookView.test.tsx`

**Interfaces:**
- Produces:
  - `listGroups(userId, { favorite?: boolean; since?: Date; limit: number; cursor?: string })`
  - `GET /api/phrase-groups?recent=true` → `since = now − RECENT_DAYS days`; `recent` and `favorite=true` together
    are allowed but unused by the UI.
  - `usePhraseGroups({ list }: { list: "saved" | "recent" })`; query keys `queryKeys.favorites` and
    `queryKeys.history` → `["phrase-groups", { recent: true }]`.
  - `PhraseGroupList` prop `list: "saved" | "recent"` instead of `favorite`.

- [ ] **Step 1: Write the failing tests**
  - Int: "lists only groups created since the given time, still paged newest first" (groups at now−8d, now−6d,
    now−1h → `since = now−7d` returns the two newest; paging with limit 1 still works).
  - Route: "passes a 7-day since for recent=true" (fake timers at `2026-11-11T12:00:00Z` → `since` is
    `2026-11-04T12:00:00Z`); "omits since otherwise".
  - `PhrasebookView.test.tsx`: tabs are "Saved" (selected) and "Recent"; Recent shows "Your phrases from the last 7
    days. Save one to keep it." and requests `recent=true`; Saved note "Holds up to 100 saved phrases."; Saved empty
    "You haven't saved any phrases yet. Save a translation to keep it here and practice it."; Recent empty "Nothing
    from the last 7 days. Translate something and it shows up here." with the Go to Translate button.

- [ ] **Step 2: Run** `npx vitest run src/app/api/phrase-groups src/ui/phrasebook` and `npm run test:int` — FAIL.

- [ ] **Step 3: Implement.** `since` adds `gte(phraseGroup.createdAt, since)` to the `where`. Filter values in
  `PhrasebookView` become `"saved" | "recent"`.

- [ ] **Step 4: Run** the same, lint, typecheck, `npm test` — PASS.

- [ ] **Step 5: Commit** — `git commit -m "Show saved phrases and the last 7 days in the Phrasebook"`

---

### Task 4: Saved and the bookmark everywhere; Practice without Recent

**Files:**
- Modify: `src/ui/FavoriteButton.tsx`, `src/ui/review/CardFavoriteButton.tsx`, `src/ui/review/PracticeSetup.tsx`,
  `src/ui/review/PracticeRound.tsx`, `src/ui/review/ReviewView.tsx`, `src/ui/review/prefs.ts`,
  `src/ui/queries.ts` (remove `useRecentGroups`, `queryKeys.recent`), `src/ui/landing/LandingPage.tsx`
- Test: `src/ui/FavoriteButton.test.tsx`, `src/ui/review/prefs.test.tsx`, `src/ui/review/ReviewView.test.tsx`,
  the Practice card button's tests if any

**Interfaces:**
- Produces: `Source = "favorites" | "starter"`; `SOURCE_LABELS.favorites === "Saved"`.

- [ ] **Step 1: Write the failing tests** (update existing ones; exact copy from the spec):
  - `FavoriteButton`: label "Save" when not saved, "Remove from saved" when saved; renders `IconBookmark` /
    `IconBookmarkFilled` (assert by accessible name and a `data-saved` attribute, not by SVG); error toast title
    "Couldn't update your saved phrases".
  - Practice card button: same labels and toast.
  - `prefs.test.tsx`: "falls back to Starter for a remembered Recent source" (`{ source: "recent", count: 5 }` →
    `{ source: "starter", count: 5 }`).
  - `ReviewView.test.tsx`: the setup offers exactly "Saved" and "Starter"; empty-saved line "Practice uses your saved
    phrases. Translate something, tap its bookmark, and it joins your deck."; drop the Recent-source cases.
  - Landing: "Save a translation and it joins your phrasebook."

- [ ] **Step 2: Run** `npx vitest run src/ui` — FAIL.

- [ ] **Step 3: Implement** the copy and icon swap (filled bookmark keeps color `native`) and remove the Recent source.
  `grep -rni favorit src/ui src/app --include=*.tsx` afterwards must show no user-facing string.

- [ ] **Step 4: Run** lint, typecheck, `npm test` — PASS.

- [ ] **Step 5: Commit** — `git commit -m "Rename favorites to saved with a bookmark and drop the Recent practice source"`

---

### Task 5: Bookmark taps while the answer streams

**Files:**
- Modify: `src/ui/FavoriteButton.tsx`, `src/ui/translate/TranslationResult.tsx`
- Test: `src/ui/FavoriteButton.test.tsx`, `src/ui/translate/TranslationResult.test.tsx`

**Interfaces:**
- Produces: `FavoriteButton({ group, pending }: { group: PhraseGroupDTO; pending?: boolean })`. While `pending`
  (group has no id) a tap toggles a local `wanted: boolean | null` shown at once; when `pending` turns false, if
  `wanted !== null && wanted !== group.isFavorite` it sends `useSetFavorite` once. Shown state:
  in-flight variables ?? `wanted` (while pending) ?? saved data ?? `group.isFavorite`.

- [ ] **Step 1: Write the failing tests**
  - "saves after the answer is stored when tapped while it streams" (render pending, tap → shows "Remove from
    saved", no fetch; rerender with stored group `id: "g1"` → one `PATCH /api/phrase-groups/g1 { isFavorite: true }`).
  - "sends nothing when tapped twice while it streams".
  - "goes back and warns when the delayed save fails" (409 `phrasebook_full` → label "Save" again, toast).
  - `TranslationResult`: replace "offers no star while the answer is still arriving" with "offers the bookmark while
    the answer is still arriving" and "keeps a pending tap when the stored group replaces the partial one" (no remount:
    drop `key={group.id}` on `FavoriteButton`; lists already key `TranslationResult` by group).

- [ ] **Step 2: Run** `npx vitest run src/ui/FavoriteButton.test.tsx src/ui/translate` — FAIL.
- [ ] **Step 3: Implement** as in Interfaces; `TranslationResult` always renders `FavoriteButton` (with `pending`)
  unless `unsaved`.
- [ ] **Step 4: Run** lint, typecheck, `npm test` — PASS.
- [ ] **Step 5: Commit** — `git commit -m "Let the bookmark be tapped while a translation streams"`

---

### Task 6: Character diff and `MorphText`

**Files:**
- Create: `src/ui/textDiff.ts`, `src/ui/textDiff.test.ts`, `src/ui/MorphText.tsx`, `src/ui/MorphText.module.css`,
  `src/ui/MorphText.test.tsx`
- Modify: `src/ui/PhraseCard.tsx` (props `morphFrom?: string`, `badge?: ReactNode`)

**Interfaces:**
- Produces:
  - `diffChars(from: string, to: string): { kind: "same" | "add" | "del"; text: string }[]` — LCS over grapheme
    clusters (`Intl.Segmenter` with `granularity: "grapheme"`), adjacent parts of the same kind merged, deletions
    before additions at a change.
  - `MorphText({ from, to }: { from: string; to: string })` — renders the diff animated: `del` parts shrink and fade
    out over `--parlo-dur-strike` with `--parlo-ease-draw`; `add` parts grow in after them over `--parlo-dur-pop`
    with `--parlo-ease-spring` and a brief shade (`--parlo-icon-btn-on-accent`) that fades. The animated spans are
    `aria-hidden`; the final text `to` is in a visually hidden span. Reduced motion: renders `to` only.
  - `PhraseCard`: `morphFrom` (when set and different from `phrase.text`) renders `MorphText` inside the phrase
    `<p>` (which keeps `lang` and `dir="auto"`); `badge` replaces the default "Original" badge on the root.

- [ ] **Step 1: Write the failing tests**
  - `diffChars("que hora es", "¿Qué hora es?")`: joining `same`+`del` parts gives `from`, joining `same`+`add`
    parts gives `to`, and the `same` parts join to `"ue hora es"`; identical strings → one `same` part; empty
    `from` → one `add` part; a grapheme is never split (`"cé"` → `"cé"`: the decomposed `é` is one
    `del` part, never a lone `́`; `"👍🏽"` stays whole).
  - `MorphText`: the accessible text is `to`; with `matchMedia('(prefers-reduced-motion: reduce)')` true it renders
    no `aria-hidden` parts.
  - `PhraseCard`: with `badge`, "Original" is not shown and the badge is; with `morphFrom`, accessible text is
    `phrase.text`.
- [ ] **Step 2: Run** `npx vitest run src/ui/textDiff.test.ts src/ui/MorphText.test.tsx src/ui/PhraseCard.test.tsx` — FAIL.
- [ ] **Step 3: Implement.** The LCS table is O(n·m) on ≤500 graphemes; a plain 2D array is fine.
- [ ] **Step 4: Run** lint, typecheck, `npm test` — PASS.
- [ ] **Step 5: Commit** — `git commit -m "Add a character diff and an animated text morph"`

---

### Task 7: Corrected / Suggestion pill replaces the correction box

**Files:**
- Create: `src/ui/CorrectionPill.tsx`, `src/ui/CorrectionPill.module.css`, `src/ui/CorrectionPill.test.tsx`
- Modify: `src/ui/phrases.ts` (`withCorrection`), `src/ui/translate/TranslationResult.tsx`,
  `src/ui/translate/TranslateView.tsx` (`animate`), `src/ui/history/GroupItem.tsx`
- Delete: `src/ui/CorrectionAlert.tsx`, `src/ui/CorrectionAlert.test.tsx`
- Test: `src/ui/phrases.test.ts`, `src/ui/translate/TranslationResult.test.tsx`

**Interfaces:**
- Consumes: `useSetCorrectionApplied` (Task 1), `MorphText` / `PhraseCard` `morphFrom` + `badge` (Task 6).
- Produces:
  - `withCorrection(group: PhraseGroupDTO, applied: boolean): PhraseGroupDTO` — the group as it looks with the
    correction applied or not (root `text`/`correctedFrom`, `correction.accepted`); returns `group` unchanged when it
    has no correction or already has that state. Typed text = `accepted ? root.correctedFrom : root.text`.
  - `CorrectionPill({ correction, typed, lang, applied, onChange, animate })` — `applied`: `IconTextSpellcheck` +
    "Corrected"; else `IconSparkles` + "Suggestion". Small badge look, 44px hit area, pops in (`--parlo-dur-pop`)
    when `animate`. Opens a Mantine `Popover` on `--parlo-surface-raised`. Applied: "You typed" + `<s lang dir="auto">
    typed</s>`, the explanation, `outline` pill button "Keep what I typed". Not applied: "Suggested" + the correction
    in bold (`lang`, `dir="auto"`), the explanation, button "Use the correction". The button calls
    `onChange(!applied)` and closes the popover.
  - `TranslationResult` prop `animate?: boolean` (Translate screen only).

- [ ] **Step 1: Write the failing tests**
  - `phrases.test.ts`: `withCorrection` reverts (root text typed, `correctedFrom` null, `accepted` false), applies
    (the reverse), and is a no-op for no correction or a matching state.
  - `CorrectionPill`: labels per state; opening shows the typed text / suggestion and the explanation; the button
    calls `onChange(false)` / `onChange(true)`.
  - `TranslationResult`: "shows Corrected on the root card for an applied correction, with no box above the cards";
    "Keep what I typed shows the typed text at once and sends `{ correctionApplied: false }`"; "goes back and warns
    when the change fails" (toast "Couldn't change the correction"); "shows Suggestion for an old group whose
    correction was not applied, and applies it"; "offers no pill when there is no correction"; "morphs the root
    card when the stored group replaces the partial one and `animate` is set" (rerender partial → stored, assert
    `aria-hidden` morph parts present); "does not morph in the Phrasebook" (no `animate`).
  - `GroupItem` single-language view: the pill shows only when the picked phrase is the root.
- [ ] **Step 2: Run** `npx vitest run src/ui` — FAIL.
- [ ] **Step 3: Implement.** In `TranslationResult`, shown applied =
  in-flight `variables.applied` ?? stored state; display group = `withCorrection(group, shownApplied)`; keep the
  previously shown root text in a ref and pass it as `morphFrom` when `animate` and it changed. Remove the lightbulb
  `ActionIcon`, `CorrectionAlert` and its import. `TranslateView` passes `animate`.
- [ ] **Step 4: Run** lint, typecheck, `npm test`, `npm run test:int` — PASS. Then check by hand per the spec's §5
  (translate "que hora es", revert, bookmark during the stream, Recent, reduced motion).
- [ ] **Step 5: Commit** — `git commit -m "Apply corrections in place with a pill to see or revert them"`
