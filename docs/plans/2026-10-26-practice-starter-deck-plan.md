# Practice Starter Deck, Favorites Naming and Compact Language Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new user can practice on the first visit (Favorites, Recent or a built-in Starter set, 5/10/20 random cards), the language strip fits a phone, and the app says "Favorites".

**Architecture:** Bundles are static typed data in `src/shared/bundles/`, loaded lazily and converted to the `PhraseGroupDTO` shape that `buildCards`/`ReviewSession` already consume. Practice gets a setup state (source, count, mode, languages) that collapses to a summary line once started; choices persist in `localStorage`. No server or database change.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/` before page code), React, Mantine v9, CSS Modules, TanStack Query, Vitest + Testing Library, Biome.

**Spec:** `docs/specs/2026-10-26-practice-starter-deck-design.md`

## Branches (one per task, merged `--no-ff` only after the author says so)

| Task | Branch | Cut from |
|------|--------|----------|
| 1. Favorites naming | `favorites-naming` | `main` |
| 2. Compact language strip | `compact-language-strip` | `main` |
| 3. Practice engine | `practice-starter-deck` (holds the spec and this plan) | itself |
| 4. Practice setup UI | `practice-starter-deck` | after 3 |
| 5. Starter data | `practice-starter-deck` | after 4 |

Tasks 3 to 5 are one feature arc on one branch; one commit per step group, tests passing at each commit.

## Progress

- [x] 1. Favorites naming (`favorites-naming`, awaiting merge)
- [x] 2. Compact language strip (merged)
- [x] 3. Practice engine (bundle types, drawing, prefs, Recent query)
- [x] 4. Practice setup UI
- [x] 5. Starter data (about 100 phrases x 13 languages) and review file

## Global Constraints

- Tokens only: `var(--parlo-*)`, no hex, no new colours; a new value goes into `tokens.css` first.
- Everything pressable is a pill, at least 44px; one primary action per screen (Practice: **Start**).
- No emoji; 1.8px stroke line icons; the star icon stays.
- Phrase elements keep `lang` and `dir="auto"`.
- Languages shown as `<Flag>` plus endonym, never a flag alone.
- Practice never calls the model or touches the quota.
- `src/shared/` imports nothing from `src/server` or `src/ui`.
- Internal identifiers (`isFavorite`, `useAllFavorites`, DB, API) are not renamed.
- Commit titles: one imperative, capitalized line, no prefix, no body, no trailers (user's CLAUDE.md).
- Verify with `npm run lint`, `npm run typecheck`, `npm test` before each commit group.

## Review Focus

Failure modes the spec implies; each has a test in the owning task.

1. `localStorage` throws, or holds garbage or an old shape: Practice opens on Starter with 10 cards (Task 3, 4).
2. Chosen count is larger than the source: practise all of them, no error (Task 3).
3. Remembered source is Favorites but the user has none: fall back to Starter (Task 3, 4).
4. Recent or Favorites is empty or fails to load: empty state with **Use Starter**, never a blank page (Task 4).
5. Arabic, Persian and Punjabi Starter cards render with `lang` and `dir="auto"` (Task 4, 5).

---

### Task 1: Favorites naming

**Files:**
- Modify: `src/ui/phrasebook/PhrasebookView.tsx` (filter value and label, limit and empty copy), `src/ui/phrasebook/PhrasebookView.test.tsx`
- Modify: `src/app/(app)/phrasebook/page.tsx`, `src/app/(app)/practice/page.tsx` (subtitle only; Task 4 rewrites it again)
- Modify: `src/ui/review/ReviewView.tsx` (summary, small-deck nudge, empty-state copy), `src/ui/review/ReviewView.test.tsx`
- Modify: `src/ui/landing/LandingPage.tsx:17`
- Modify: `src/server/phrases/types.ts` (`PhrasebookFullError` message stays "The phrasebook is full" unless it says "star": check), plus the matching test if its text changes
- Check and update: `src/ui/FavoriteButton.tsx` labels, `src/ui/landing/PracticeDemo.tsx`, `src/ui/translate/TranslationResult.tsx`

**Interfaces:** Produces: no code interface. The Phrasebook `Filter` becomes `"all" | "favorites"`; the radio labels are "All" and "Favorites".

- [ ] **Step 1: Branch** `git checkout main && git checkout -b favorites-naming`.
- [ ] **Step 2: Update the tests first.** In `PhrasebookView.test.tsx` and `ReviewView.test.tsx` replace expectations with the new copy: radio name `"Favorites"`; `"Holds up to 100 favorite phrases."`; `"Keeps your last 500 phrases. Favorite phrases stay."`; `/haven't added any favorites yet/i`; deck summary `"2 favorite phrases"` and `"5 favorite phrases"`; empty Practice text `/practice uses your favorite phrases/i`. Rename the test titles that say "starred".
- [ ] **Step 3: Run** `npm test -- PhrasebookView ReviewView`. Expected: FAIL on the old copy.
- [ ] **Step 4: Change the copy** in every file listed so the same strings appear. Wording rules: "Favorites" capitalized as a label; "favorite" lowercase in sentences; "Add a translation to your favorites and it joins your deck." for the Practice empty state; the small-deck nudge becomes "Small deck so far. Favorite more translations and they will join it."
- [ ] **Step 5: Sweep.** Run `grep -rniE "starred|\bstar(s|ring)?\b" src --include='*.ts' --include='*.tsx'` and confirm that what remains is only identifiers, `IconStar*` imports, comments about the icon, and test fixture names. Fix any user-facing leftover, including `aria-label`s and notification titles.
- [ ] **Step 6: Verify** `npm run lint && npm run typecheck && npm test`. Expected: all pass.
- [ ] **Step 7: Commit** `git commit -am "Rename Starred to Favorites in the interface"`.

---

### Task 2: Compact language strip

**Files:**
- Modify: `src/ui/translate/LanguageStrip.tsx`, `LanguageStrip.module.css`, `LanguageStrip.test.tsx`
- Check: `src/ui/translate/TranslateView.tsx:33` (the call site) and `TranslateView.module.css`

**Interfaces:** Consumes: `LanguageStrip({ languages: ProfileLanguage[]; detected?: Lang })`. Produces: same props, same export; it is no longer a link.

- [ ] **Step 1: Branch** `git checkout main && git checkout -b compact-language-strip`.
- [ ] **Step 2: Update tests.** In `LanguageStrip.test.tsx`: add `it("is not a link")` asserting `screen.queryByRole("link")` is null; add `it("describes the languages and the detected one to screen readers")` asserting an element with `role="group"` named `/Your languages: Español, English, Français\. Detected: English\./`; keep the existing detected-highlight assertion (`data-detected`). Remove any assertion on `href="/profile"`.
- [ ] **Step 3: Run** `npm test -- LanguageStrip`. Expected: FAIL (still a link).
- [ ] **Step 4: Implement.** Root becomes `<div role="group" aria-label=...>` with the same label text minus "Change them in your profile." Pill: min-height 32px, flag `size="20px"`, `font: 600 14px / 1 var(--parlo-font-sans)`, padding `0 var(--parlo-space-3) 0 6px`; remove the hover rule. Strip: `display: flex; flex-wrap: nowrap; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none;` plus `.strip::-webkit-scrollbar { display: none; }`; pills get `flex: 0 0 auto`. Keep `max-width: 100%` so the row scrolls instead of widening the page. No fade.
- [ ] **Step 5: Confirm the profile is still reachable** from the app menu (grep the header/menu for `/profile`); if it is not, stop and ask the author.
- [ ] **Step 6: Check in a browser** at 390px and 320px wide with profile Українська / Português / हिन्दी: one row, no page horizontal scroll, row scrolls on its own. Use the `run` skill to launch the app. Report what was seen.
- [ ] **Step 7: Verify** `npm run lint && npm run typecheck && npm test`.
- [ ] **Step 8: Commit** `git commit -am "Make the language strip compact and scrollable"`.

---

### Task 3: Practice engine

**Files:**
- Create: `src/shared/bundles/types.ts`, `src/shared/bundles/index.ts`
- Create: `src/ui/review/bundles.ts`, `src/ui/review/bundles.test.ts`
- Create: `src/ui/review/prefs.ts`, `src/ui/review/prefs.test.ts`
- Modify: `src/ui/review/session.ts` (add `pickRandom`), `src/ui/review/session.test.ts`
- Modify: `src/ui/queries.ts` (add `useRecentGroups`)
- Create (temporary fixture, replaced in Task 5): `src/shared/bundles/starter/index.ts` exporting a 3-phrase `starter` so Tasks 3 and 4 run

**Interfaces:**
- Produces, `src/shared/bundles/types.ts`:
  ```ts
  export interface BundlePhrase {
    id: string; // "starter-014", stable, never reused
    topic: string;
    /** The language the phrase was originally written in; the other 12 are translations. Only "en" and "fr" for now. */
    source: "en" | "fr";
    text: Record<Lang, string>; // all 13, enforced by the type
  }
  export interface Bundle { id: BundleId; name: string; phrases: BundlePhrase[] }
  ```
- Produces, `src/shared/bundles/index.ts`: `export type BundleId = "starter"; export const BUNDLE_LOADERS: Record<BundleId, () => Promise<Bundle>>` (each loader is a dynamic `import()`, so the data loads only on Practice).
- Produces, `src/ui/review/bundles.ts`: `bundleToGroups(bundle: Bundle): PhraseGroupDTO[]`; ids `bundle:<phrase id>`, phrases in `LANG_CODES` order, `isRoot: false`, `correctedFrom: null`, `isFavorite: false`, `notes: null`, `correction: null`, `createdAt` a fixed ISO string.
- Produces, `src/ui/review/prefs.ts`:
  ```ts
  export type Source = "favorites" | "recent" | "starter";
  export const COUNTS = [5, 10, 20] as const;
  export type Count = (typeof COUNTS)[number];
  export interface PracticePrefs { source: Source; count: Count }
  export const DEFAULT_PREFS: PracticePrefs; // { source: "starter", count: 10 }
  export function loadPrefs(): PracticePrefs; // never throws; unknown or garbage -> DEFAULT_PREFS
  export function savePrefs(prefs: PracticePrefs): void; // never throws
  export function resolveSource(prefs: PracticePrefs, favoritesCount: number): Source; // favorites with 0 -> "starter"
  ```
  localStorage key `parlo.practice`.
- Produces, `session.ts`: `pickRandom<T>(items: T[], count: number, random?: () => number): T[]` (shuffled copy, first `count`).
- Produces, `queries.ts`: `useRecentGroups({ enabled }: { enabled: boolean })` returning the query for `/api/phrase-groups?favorite=false&limit=100`, key `queryKeys.recent = ["phrase-groups", { favorite: false, all: true }]`.

- [ ] **Step 1: Failing tests.**
  - `prefs.test.ts`: `loadPrefs()` returns `DEFAULT_PREFS` when storage is empty; when it holds `"{not json"`; when it holds `{"source":"nope","count":7}`; when `localStorage.getItem` throws (spy). `savePrefs` then `loadPrefs` round-trips `{source:"recent",count:20}`; `savePrefs` doesn't throw when `setItem` throws. `resolveSource({source:"favorites",count:5}, 0)` is `"starter"`; with 3 it is `"favorites"`; `"recent"` stays `"recent"` at any count.
  - `session.test.ts`: `pickRandom([1,2,3,4,5], 3, () => 0)` has length 3 and contains no duplicates; `pickRandom([1,2], 20)` returns both; it does not mutate the input.
  - `bundles.test.ts`: `bundleToGroups` of a 2-phrase fixture gives ids `["bundle:s-1","bundle:s-2"]`, 13 phrases each, in `LANG_CODES` order, and `buildCards(groups, "ar", ["es","en","ar"])` yields 2 cards with `skipped === 0`.
- [ ] **Step 2: Run** `npm test -- prefs session bundles`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** the modules per Interfaces. `loadPrefs` validates `source` against the three values and `count` against `COUNTS`, field by field, falling back per field.
- [ ] **Step 4: Add `useRecentGroups`** using `useQuery` like `useAllFavorites`, with `enabled` passed through. Add a test in a new `src/ui/queries.recent.test.tsx` only if the existing queries tests have a pattern to copy; otherwise Task 4's component tests cover it.
- [ ] **Step 5: Temporary starter fixture.** Create `src/shared/bundles/starter/index.ts` exporting `starter: Bundle` with 3 phrases written in all 13 languages (they are replaced wholesale in Task 5). Wire `BUNDLE_LOADERS.starter = () => import("./starter").then((m) => m.starter)`.
- [ ] **Step 6: Run** `npm run lint && npm run typecheck && npm test`. Expected: pass.
- [ ] **Step 7: Commit** `git add -A && git commit -m "Add Practice bundles, drawing and saved choices"`.

---

### Task 4: Practice setup UI

**Files:**
- Create: `src/ui/review/PracticeSetup.tsx`, `PracticeSetup.module.css` (only if layout needs it), `SetupSummary.tsx`
- Modify: `src/ui/review/ReviewView.tsx`, `ReviewView.test.tsx`
- Modify: `src/app/(app)/practice/page.tsx` (subtitle: "Read a phrase, try to recall the rest, then reveal.")

**Interfaces:**
- Consumes: `PracticePrefs`, `Source`, `Count`, `COUNTS`, `loadPrefs`, `savePrefs`, `resolveSource` (Task 3); `bundleToGroups`, `BUNDLE_LOADERS`; `pickRandom`, `buildCards`, `ReviewSession`; `useAllFavorites`, `useRecentGroups`; the existing `LanguageMenu`, `ModeSelect`, `Session`.
- Produces: `PracticeSetup({ prefs, favoritesCount, mode, onPrefs, onMode, languageControls, onStart }): JSX` (the Source and Cards segmented controls, the existing mode and language controls passed as children, one filled **Start** pill) and `SetupSummary({ source, count, onChange }): JSX` (one line "Starter · 10 cards" with a subtle **Change** button, 44px).

Behavior to build (see spec 3.1):
- `ReviewView` holds `prefs` (initial: `loadPrefs()` in a lazy `useState`, then `resolveSource` once favorites have loaded), `started: boolean`, and the existing `chosen`, `mode`, `chosenAnswer`, `round`.
- Not started: show `PracticeSetup`; no deck. Started: `SetupSummary` above the deck. **Change** sets `started=false`. Pressing **Start** calls `savePrefs`, sets `started=true` and bumps `round`.
- Source groups: favorites → `favorites.data.items`; recent → `useRecentGroups({enabled: source==="recent"})` items; starter → loaded bundle via `BUNDLE_LOADERS.starter()` in a `useQuery` (`queryKey: ["bundle","starter"]`, `staleTime: Infinity`) mapped by `bundleToGroups`.
- `Session` receives the groups and `count`; it builds cards with `buildCards`, then `pickRandom(cards, count, random)` and passes the result to `ReviewSession` (which still shuffles). The "skipped" line stays, based on `built.skipped`.
- Empty Favorites or Recent after Start: the empty state in `Session` adds a secondary **Use Starter** button that sets `prefs.source="starter"` and restarts; keep **Go to Translate**. Load errors for the chosen source show the existing red `Alert`, with the same **Use Starter** escape.
- Remove the old `DeckSummary`, the small-deck nudge and the "starred" gating (`starred > 0 && ...`); the Source control shows `Favorites {n}`.

- [ ] **Step 1: Branch state.** Stay on `practice-starter-deck` (Task 3 done).
- [ ] **Step 2: Rewrite the failing tests** in `ReviewView.test.tsx`. Existing tests that start a session now first press **Start**: add a helper `start = () => click(/^start$/i)`, and a `mockApi` that also answers `favorite=false` with the same groups. New tests (names are the contract):
  - `"opens on setup with Starter and 10 cards on a first visit"`: no cards shown, radio `Starter` and `10` checked, a **Start** button.
  - `"remembers the last source and count"`: set `localStorage["parlo.practice"]` to `{"source":"recent","count":20}`; the `Recent` and `20` radios are checked.
  - `"falls back to Starter when saved Favorites is empty"`: saved favorites, API returns no favorites; `Starter` is checked.
  - `"survives unreadable storage"`: `localStorage.getItem` throws; setup still renders on Starter and 10.
  - `"deals only as many cards as asked"`: favorites of 7 groups, count 5 → the progress text reads `0 of 5`.
  - `"deals everything when fewer cards exist than asked"`: 2 favorites, count 10 → `0 of 2`.
  - `"collapses setup to a summary once started"`: after Start, the text `Favorites · 5 cards` and a **Change** button show, and no Start button; pressing **Change** brings setup back.
  - `"offers Starter when Favorites is empty"`: choose Favorites with none, Start → heading about an empty deck, **Use Starter** pressed → cards appear (`0 of 10` with the fixture of 3 → `0 of 3`).
  - `"deals Recent from history"`: the fetch mock is called with a URL containing `favorite=false&limit=100`.
  - `"does not request history unless Recent is chosen"`: with Favorites chosen, no call has `favorite=false`.
  - `"shows Starter cards in Arabic with lang and dir=auto"`: practice language `ar` in the profile; the card phrase element has `lang="ar"` and `dir="auto"`.
  - `"practice again deals a fresh draw from the same source"`: finish a 1-card session; **Practice again** returns cards without going back to setup.
- [ ] **Step 3: Run** `npm test -- ReviewView`. Expected: FAIL.
- [ ] **Step 4: Implement** `PracticeSetup`, `SetupSummary` and the `ReviewView` rewrite per the behavior list; reuse `LanguageMenu`, `ModeSelect` unchanged. Layout rule: setup is one compact column (Source, Cards on one row each at 390px; mode and languages as they are now; Start last), no card chrome beyond existing surface tokens. Mantine `SegmentedControl` with `aria-label`s "Where cards come from" and "How many cards".
- [ ] **Step 5: Run** `npm test -- ReviewView`. Expected: PASS. Then `npm run lint && npm run typecheck && npm test`.
- [ ] **Step 6: Browser check** with the `run` skill at 390px: first visit shows setup with Start visible without scrolling; after Start the card's top edge is no lower than it was before this change (compare with `main`). Report what was seen.
- [ ] **Step 7: Commit** `git add -A && git commit -m "Add Practice setup with Favorites, Recent and Starter sources"`.

---

### Task 5: Starter data and review file

**Files:**
- Modify: `src/shared/bundles/starter/index.ts` (replace the 3-phrase fixture), create topic files `src/shared/bundles/starter/<topic>.ts` (each exports `BundlePhrase[]`)
- Create: `src/shared/bundles/starter.test.ts`
- Create: `scripts/starter-review.mts`, add `"starter:review": "tsx scripts/starter-review.mts"` to `package.json`
- Create (generated, committed): `docs/starter-review.md`

**Interfaces:** Consumes: `Bundle`, `BundlePhrase`, `LANG_CODES`. Produces: `starter: Bundle` with `id: "starter"`, `name: "Starter"`, about 100 phrases; ids `starter-001` to `starter-NNN`, never renumbered once released.

- [ ] **Step 1: Failing tests** in `starter.test.ts`:
  - `"has about a hundred phrases"`: length between 95 and 105.
  - `"ids are unique and shaped starter-NNN"`: regex `/^starter-\d{3}$/`, no duplicates.
  - `"every phrase has all 13 languages, non-empty and trimmed"`: iterate `LANG_CODES`.
  - `"is about 80% English and 20% Québécois French sources"`: count of `source === "en"` between 75 and 85, rest `"fr"`.
  - `"has no duplicate source text"`.
  - `"covers the topics"`: the set of `topic` values includes greetings, transit, shops, restaurants, health, work-school, housing, phone-banking, small-talk, emergencies.
  - `"script-specific letters are present"`: `ar` and `fa` entries match `/[؀-ۿ]/`, `pa` matches `/[਀-੿]/`, `hi` matches `/[ऀ-ॿ]/`, `uk` and `ru` match `/[Ѐ-ӿ]/`, `zh` matches `/[一-鿿]/`.
- [ ] **Step 2: Run** `npm test -- starter.test`. Expected: FAIL.
- [ ] **Step 3: Write the data.** Topic files with about 10 phrases each, per spec 3.2: everyday newcomer life in Canada; short and natural; include one- and two-word quick phrases; Canadian English sources for 80, Québécois French sources (Québec wording) for 20; translations carry meaning, written in each language's most common form (first entry of its `regions`), no regional slang, normal scripts (Gurmukhi, Arabic, Persian, Devanagari, Cyrillic, Hanzi with Simplified characters). Place the source language's own text under its key like any other.
- [ ] **Step 4: Run** `npm test -- starter.test`. Expected: PASS.
- [ ] **Step 5: Review script.** `scripts/starter-review.mts` imports `starter` and writes `docs/starter-review.md`: a heading, a one-line note that it is generated by `npm run starter:review`, then one Markdown table with columns `id | topic | src | es | en | fr | uk | pt | zh | pa | tl | ar | hi | ru | it | fa`. Escape `|` in cells. Run `npm run starter:review`.
- [ ] **Step 6: Verify** `npm run lint && npm run typecheck && npm test`; open one Arabic and one Chinese Starter card in the browser (`run` skill) and confirm they render and read in the right direction.
- [ ] **Step 7: Commit** `git add -A && git commit -m "Add the Starter phrase set and its review table"`.
- [ ] **Step 8: Hand over** to the author: branch name, `docs/starter-review.md` to skim, how to try it (`npm run dev`, open Practice). Wait for corrections to the translations; each fix is one small commit on the same branch. Do not merge until told.

---

## Self-review notes

- Spec coverage: 3.1 (Tasks 3, 4), 3.2 (3, 5), 3.3 (2), 3.4 (1), constraints (global section, lazy loading in Task 3's `BUNDLE_LOADERS`), review table (5). The spec says the BundlePhrase has no `source`; this plan adds `source: "en" | "fr"` so the 80/20 mix is testable (spec updated to match).
- Types used across tasks: `Source`, `Count`, `PracticePrefs`, `BundleId`, `Bundle`, `BundlePhrase`, `bundleToGroups`, `pickRandom`, `useRecentGroups`, `queryKeys.recent` are defined in Task 3 and used unchanged in Tasks 4 and 5.
