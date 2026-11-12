# Parlo — Applied Corrections, Recent Phrases and Saved Design

Extends [`2026-10-21-history-and-review-design.md`](2026-10-21-history-and-review-design.md) and
[`2026-10-26-practice-card-favorites-design.md`](2026-10-26-practice-card-favorites-design.md). Where they disagree, this
document wins for how corrections show on a translation, what the Phrasebook lists and what a saved phrase is called.

## 1. Intent

Translations now stream: the cards appear first and the correction (if any) arrives with the final `done` line. Today
that correction lands as a box **above** the cards, pushing the translation down just as the user is reading it. Most
corrections are typos (missing accents, `¿`, `ç`, wrong letters), so the user almost always wants them. The
correction should be applied for them, in place, without moving anything, with a clear mark that it happened and a
way to see it and go back to what they typed.

Translation is now a tool inside a practice app, so keeping every translation in sight is noise. The Phrasebook
should show **recent** phrases (the last 7 days) next to the ones the user chose to keep, and "Favorite" becomes
**Saved**, with a bookmark instead of a star.

### Goals

- A correction is applied automatically, in the root card, with a short animated morph from the typed text to the
  corrected text. Nothing else on screen moves.
- The root card's "Original" badge becomes a **Corrected** pill when a correction is applied. Tapping it opens a
  bubble with what was typed, why it changed, and **Keep what I typed**.
- Reverting restores the typed text everywhere (Translate, Phrasebook, Practice); it can be re-applied.
- The Phrasebook has two tabs: **Saved** and **Recent** (last 7 days).
- "Favorite" is renamed **Saved** in every user-facing string; the star becomes a bookmark.
- Practice loses its **Recent** source: it practices **Saved** or **Starter**.
- The bookmark and the correction actions are optimistic and usable while the answer is still streaming.

### Non-goals

- Deleting phrases older than 7 days. They are hidden from Recent, not removed. The existing 500-phrase trim stays.
- Changing the database schema. `isFavorite` keeps its name and meaning (= saved).
- Better bundle discovery or picking for Practice (a separate thread).
- Persistently underlining the characters that changed.

### Anti-goals

- The translation cards must not shift when a correction arrives (no new row above or between them).
- No extra wait for the translation itself: the cards still appear as they stream.
- No motion that ignores `prefers-reduced-motion`.
- A tap on the bookmark or on Keep what I typed must never be lost or fail because the phrase was not stored yet.

## 2. Decisions made with the user

- Corrections are auto-applied; the user can see and revert them.
- Marker: option "B" from the mockups. The root card's badge changes to a pill; tapping it opens a bubble that floats
  over the cards (it takes no layout space).
- Pill labels and icons (Tabler, 1.8 stroke):
  - Applied: `IconTextSpellcheck` + **Corrected**.
  - Reverted (a correction exists but the typed text is in use): `IconSparkles` + **Suggestion**.
  - No correction: the plain **Original** badge, as today.
- The pill appears with a subtle pop animation when the correction lands.
- The text change is a subtle animation: characters removed by the correction slide/fade out, added ones grow in with a
  brief shade that fades. The diff is computed in the browser at animation time and **not stored**.
- Apply and revert update the phrase group: apply puts the corrected text in the root phrase and keeps the typed text
  in `correctedFrom`; revert puts the typed text back. The correction text and explanation are never removed;
  `correctionAccepted` records which one is in use.
- The lightbulb button and the `CorrectionAlert` box go away.
- Phrasebook tabs: **Saved** | **Recent**. Recent shows the last 7 days and says so.
- "Saved" with a bookmark icon (`IconBookmark` / `IconBookmarkFilled`) replaces "Favorites" and the star.
- Practice sources: Saved and Starter only.
- The history trim already runs after the response (Next `after()`); it must stay off the translation's critical path.
- The bookmark is enabled as soon as the cards show. A tap is reflected immediately; the request is sent once the
  phrase is stored. On error, the bookmark returns to its previous state and a notification says why.
- The server sends `done` only once the phrase group is stored, so any id the client holds refers to a stored group.

## 3. Calls made by the author of this document

- **Storing an applied correction.** `insertGroup` stores a group that came with a correction already applied: root
  `text` = correction text, `correctedFrom` = typed text, `correctionAccepted = true`. `describeNewGroup` returns the
  same shape. A correction whose text equals the typed text (after trimming) is treated as no correction.
- **Old groups.** Groups saved before this change with an un-accepted correction show the **Suggestion** pill. They are
  not migrated.
- **API.** `PATCH /api/phrase-groups/:id` takes `{ correctionApplied: boolean }` in place of
  `{ acceptCorrection: true }`. It is idempotent: setting the state it already has returns the group unchanged (no
  `already_accepted` error, which suits optimistic and repeated taps). `{ correctionApplied: … }` on a group without a
  correction still returns 409 `no_correction`. The repository method becomes `setCorrectionApplied(userId, id,
  applied)`, row-locked as `acceptCorrection` is today.
- **Ordering in the translation route.** The group insert runs concurrently with `limiter.record`, and both are
  awaited before `done` is pushed. The added wait is the insert's duration minus the usage record's, and the cards
  are already on screen, so the user only sees the correction land a few milliseconds later.
- **The history trim stays off the critical path.** `pruneHistory` moves out of `insertGroup`'s transaction into its
  own repository method, run with Next's `after()` once the insert has committed, so `done` never waits for the
  count-and-delete. It still never deletes saved groups or the group just stored. A failed trim only logs (the next
  save trims again).
- **A failed save.** The model's answer was good, so the user keeps it on screen: the route sends `{ type: "error",
  error: "save_failed" }`, and the Translate screen keeps the cards it already shows (the partial group), hides the
  bookmark, and shows a notification "Couldn't save this translation. It won't be in your phrasebook." Usage is
  recorded as today.
- **Pending taps before `done`.** The Translate result keeps the user's intent locally while `pending`:
  - Bookmark: a boolean "wanted saved". Toggling twice before `done` cancels out. On `done`, if it differs from the
    stored group's `isFavorite`, send `PATCH { isFavorite }`.
  - Corrections can't be tapped before `done` (the pill only appears with `done`), so they need no queue; their
    PATCH is still sent with the optimistic state shown first and rolled back on error.
- **Morph animation.** Runs only on the Translate screen, when the stored group replaces the partial one and its root
  text differs from what the partial showed, and again when the user taps Keep what I typed / Use the correction.
  Phrasebook items render the final text without animation. Diff: a character-level longest-common-subsequence on
  code points (strings are ≤500 characters; this is instant). It lives in a small pure function under `src/ui/` with
  unit tests. The animation uses the existing motion timings (`--parlo-dur-strike`, `--parlo-dur-pop`,
  `--parlo-ease-spring`). With `prefers-reduced-motion`, the text and pill swap instantly. Screen readers get the final
  text only (animated fragments are `aria-hidden` with the final text visually hidden alongside, or equivalent).
- **The bubble.** A Mantine `Popover` anchored to the pill, on a raised surface (`--parlo-surface-raised`), so the
  cards never move. Content when applied: "You typed ~~que hora es~~", the explanation, and a ghost (`outline`) pill
  button **Keep what I typed**. When reverted: "Suggested: **¿Qué hora es?**", the explanation, and **Use the
  correction**. The typed/corrected phrase keeps `lang` and `dir="auto"`. The pill keeps its small badge look but has
  a 44px hit area.
- **The pill in other places.** `TranslationResult` is also used by Phrasebook items, so the pill and bubble work there
  too. In the single-language Phrasebook view (`showIn` ≠ all) the pill shows only when the picked phrase is the root.
- **Recent tab.** `GET /api/phrase-groups` gains `recent=true`, filtering `created_at >= now() - 7 days` on the server
  (cursor pagination unchanged). Recent includes saved phrases from those 7 days, with their bookmark filled. Note at
  the top: "Your phrases from the last 7 days. Save one to keep it." Empty state: "Nothing from the last 7 days.
  Translate something and it shows up here." with the existing Go to Translate button. The 7-day window is a constant,
  not an env variable.
- **Saved tab.** Default tab, as Favorites is now. Note: "Holds up to {limit} saved phrases." Empty state: "You haven't
  saved any phrases yet. Save a translation to keep it here and practice it."
- **Renamed copy** (user-facing only; code identifiers, query keys, API fields and the `favorite` query parameter stay):
  - Phrasebook tab "Favorites" → "Saved"; "All" → "Recent".
  - Bookmark tooltip / label: "Save" / "Remove from saved" (Translate and Phrasebook); same on the Practice card.
  - Error toasts: "Couldn't update your saved phrases".
  - Practice source label "Favorites" → "Saved"; the empty-source line becomes "Practice uses your saved phrases.
    Translate something, tap its bookmark, and it joins your deck."
  - Landing: "Save a translation and it joins your phrasebook."
  - Filled bookmark keeps today's filled-star color (`native`).
- **Practice "Recent" removed.** `Source` becomes `"favorites" | "starter"`; `useRecentGroups` and its query key are
  removed. A stored `"recent"` preference is unknown to `loadPrefs`, so it falls back to the default (Starter), and
  `resolveSource` keeps sending an empty Saved to Starter. The source labelled Saved keeps the internal id
  `favorites` so stored preferences still match.

## 4. Left to the builder

- Component structure (e.g. a `CorrectionPill` in `src/ui/` with its `.module.css`) and how the morph is rendered.
- Exact animation keyframes within the existing motion vocabulary.
- How the pending bookmark intent is held (state in `TranslationResult` or a small hook).
- Test layout, following the repo: unit tests for the diff, the pill and the bookmark queue; route tests for
  `done` after the insert and for the PATCH; integration tests (`npm run test:int`) for storing an applied correction,
  `setCorrectionApplied` both ways, and the `recent` filter.

## 5. Verification

`npm run lint`, `npm run typecheck`, `npm test` and `npm run test:int` pass. By hand: translate "que hora es" and
watch the Spanish card morph to "¿Qué hora es?" without the other cards moving; tap Corrected → Keep what I typed and
see the typed text in the Phrasebook and in Practice; tap the bookmark while the cards are still streaming and find
the phrase under Saved; check the Recent tab note and that a phrase older than 7 days is not listed; check with
reduced motion on.
