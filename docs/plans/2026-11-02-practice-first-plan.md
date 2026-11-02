# Practice First (epic 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Practice becomes the front door: a signed-out visitor plays a round of Starter cards on the landing page, and a signed-in user lands on Practice with a round already dealt.

**Architecture:** The round (`Session` inside `ReviewView.tsx`) becomes a reusable `PracticeRound` that takes the viewer's languages as input and can hide everything that needs an account. The signed-in page deals a round on arrival; the landing page builds the same round from a picked native language plus English (Canada) and French (France). The visitor's pick lives in `localStorage` and pre-fills the language picker after signup. No server, API or database change.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/` before page code), React, Mantine v9, CSS Modules, TanStack Query, Vitest + Testing Library, Biome.

**Spec:** `docs/specs/2026-11-02-practice-first-design.md`

## Branches (one per stage, merged `--no-ff` only after the author says so)

| Task | Branch | Cut from |
|------|--------|----------|
| 1. Reusable round without an account | `practice-first` (holds the spec and this plan) | itself |
| 2. Practice deals on arrival, native on the front | `practice-first` | after 1 |
| 3. Tab order and post-login page | `practice-first-nav` | `main` (after `practice-first` merges) |
| 4. Remembered native pick and signup prefill | `practice-landing-game` | `main` (after `practice-first` merges) |
| 5. Landing game | `practice-landing-game` | after 4 |

Tasks 1 and 2 are one arc, as are 4 and 5. Tasks 3 and 4 touch different files and may be built in either order.

## Progress

- [ ] 1. Reusable round without an account
- [ ] 2. Practice deals on arrival, native on the front
- [ ] 3. Tab order and post-login page
- [ ] 4. Remembered native pick and signup prefill
- [ ] 5. Landing game

## Global Constraints

- Tokens only: `var(--parlo-*)`, no hex, no new colours; a new value goes into `tokens.css` first.
- Everything pressable is a pill, at least 44px; one primary action per screen.
- No emoji; 1.8px stroke line icons. Copy is short, warm, plain.
- A language is its circular `<Flag>` plus its own name (endonym), never a flag alone.
- Phrase elements keep `lang` and `dir="auto"`. Motion respects `prefers-reduced-motion`.
- Reuse `Flag`, `PhraseCard` and the Practice components before building anything new; new shared pieces go in `src/ui/` with a `.module.css`.
- Practice never calls the model or touches the quota; a visitor's round makes no network request and writes nothing to the server.
- Copy never promises progress saving or anything else that does not exist yet.
- `src/shared/` imports nothing from `src/server` or `src/ui`.
- Commit titles: one imperative, capitalized line, no prefix, no body, no trailers (user's CLAUDE.md).
- Verify with `npm run lint`, `npm run typecheck`, `npm test` before each commit.

## Review Focus

1. `localStorage` blocked, empty, garbage, or holding `"en"`, `"fr"` or an unknown code: the landing page shows the plain native picker and the signup picker shows its normal empty state (Tasks 4, 5).
2. A visitor's round never calls `fetch` (no profile, favorites, recent or bundle-favorite request) (Tasks 1, 5).
3. A signed-in user whose saved choice is Favorites but who has none gets Starter dealt, not an empty deck (Task 2).
4. A stored native pick must not linger once the person has a profile (Task 4).
5. Landing page rendered on the server with a stored pick must not mismatch on the client: the pick is read after mount (Task 5).

---

### Task 1: Reusable round without an account

**Files:**
- Create: `src/ui/review/PracticeRound.tsx` (the `Session` and `snapshot` code moved out of `ReviewView.tsx`)
- Modify: `src/ui/review/ReviewView.tsx` (import and use `PracticeRound`), `src/ui/review/PracticeDeck.tsx`
- Test: `src/ui/review/PracticeRound.test.tsx`; `ReviewView.test.tsx` must pass unchanged

**Interfaces:**
- Produces:
  ```ts
  export function PracticeRound(props: {
    groups: PhraseGroupDTO[];
    source: Source;
    count: number;
    practice: Lang;
    answerLang?: Lang;
    languages: ProfileLanguage[];        // profile order; carries each language's region
    favorites: boolean;                  // false: no star on the cards
    random?: () => number;
    onRestart: () => void;
    onUseStarter?: () => void;           // omit: the empty-deck buttons are not shown
    finishedFooter?: ReactNode;          // rendered under the Done summary
  }): JSX.Element
  ```
  `PracticeDeck` gains `region?: string` and `favorite: boolean` and loses its `useProfileRegion` call, so it makes no request itself. `PracticeRound` computes the region from `languages`.
- Consumes: `buildCards`, `pickRandom`, `ReviewSession`, `RevealPanel`, `TypedPanel` (unchanged).

- [ ] **Step 1: Write the failing tests** in `PracticeRound.test.tsx` (render with `renderWithProviders`, `fetch` stubbed to throw if called, three cards built with `makeGroup` in es/en/fr, `random = () => 0.999999`):
  - `"shows no favorite star when favorites is false, and never calls fetch"`: assert `queryByRole("button", { name: /favorites/i })` is null and the fetch stub was not called.
  - `"shows the star when favorites is true"` (stub fetch to answer the favorites query with an empty list).
  - `"puts finishedFooter under the Done summary"`: grade every card "Got it", expect the footer text next to "Done".
  - `"hides the empty-deck buttons without onUseStarter"`: render with `groups=[]`, expect no "Use Starter" button.
- [ ] **Step 2: Run** `npx vitest run --project ui src/ui/review/PracticeRound.test.tsx`. Expected: FAIL (module not found).
- [ ] **Step 3: Move `Session` and `snapshot` into `PracticeRound.tsx`** under the signature above (the old `profileLangs: Lang[]` becomes `languages.map((l) => l.lang)`); add the `favorites`, `finishedFooter` and optional `onUseStarter` behaviour; thread `region` and `favorite` into `PracticeDeck` (render `CardFavoriteButton` only when `favorite`). When `finishedFooter` is present the "Practice again" button uses `variant="default"`, so the footer owns the screen's single primary action. `ReviewView` renders `<PracticeRound favorites languages={languages} … />`.
- [ ] **Step 4: Run** `npm run lint && npm run typecheck && npm test`. Expected: all pass, including the untouched `ReviewView.test.tsx`.
- [ ] **Step 5: Commit** `Extract the practice round so it can run without an account`

### Task 2: Practice deals on arrival, native on the front

**Files:**
- Modify: `src/ui/review/ReviewView.tsx`, `src/ui/review/SetupSummary.tsx` (only if the label changes; keep "Setup" otherwise)
- Test: `src/ui/review/ReviewView.test.tsx`

**Interfaces:**
- Consumes: `PracticeRound` (Task 1), `loadPrefs`, `resolveSource`, `resolveCount`, `dealtCount`.
- Produces: `ReviewView` starts in the dealt state. The default practice language becomes `languages[0].lang` (the native one); the "Practice in" menu and typing defaults otherwise behave as today. "Setup" returns to the setup screen and Start deals a new round, discarding the current one.

- [ ] **Step 1: Update and add tests.** In the `start()` helper's callers, tests about the setup screen first press the existing "Setup" button, then `start()`. New or changed tests:
  - `"deals a round on arrival, with the native language on the front"`: no saved prefs, empty favorites; without pressing anything the Spanish text of the first card is visible and its English and French are hidden until Reveal; the summary reads "Starter · 10 cards".
  - `"deals the saved source and count on arrival"`: saved `{ source: "recent", count: 5 }` shows "Recent · 5 cards" (history has at least 5 groups).
  - `"deals Starter when the saved source is Favorites and there are none"` (Review Focus 3).
  - `"Setup returns to the setup, and Start deals again"`: press Setup, change count to 5, Start, expect "· 5 cards".
  - Replace `"starts in the second language…"` with the native-front assertion above.
- [ ] **Step 2: Run** `npx vitest run --project ui src/ui/review/ReviewView.test.tsx`. Expected: the new and changed tests FAIL.
- [ ] **Step 3: Implement** in `ReviewView.tsx`: `started` begins true; the dealt count is derived from the saved prefs once the active source is ready (no flash of the setup screen: show the existing `<Loader>` until then); `practice` defaults to `languages[0].lang`. The saved-prefs write stays on Start.
- [ ] **Step 4: Run** `npm run lint && npm run typecheck && npm test`. Expected: pass.
- [ ] **Step 5: Commit** `Deal a Practice round on arrival with the native language up front`

### Task 3: Tab order and post-login page

**Files:**
- Modify: `src/ui/NavLinks.tsx` (order Practice, Translate, Phrasebook), `src/ui/AppLayout.tsx` (the logo link `href="/"` becomes `"/practice"`), `src/ui/auth/GoogleSignInButton.tsx:44` and the email sign-in in `src/ui/auth/SignInForm.tsx` (`callbackURL: "/practice"`)
- Test: `src/ui/AppLayout.test.tsx`, `src/ui/auth/GoogleSignInButton.test.tsx`, `src/ui/auth/SignInForm.test.tsx`

**Interfaces:** none new. `/` stays Translate; signed-out `/` still shows the landing page (`src/proxy.ts` untouched).

- [ ] **Step 1: Write the failing tests:** in `AppLayout.test.tsx`, `"lists the sections in the order Practice, Translate, Phrasebook"` (read the link names from the Main navigation in DOM order); `"sends the logo to Practice"` (`getByRole("link", { name: "parlo, home" })` has `href="/practice"`); in the two auth tests, change the expected `callbackURL` from `"/"` to `"/practice"`.
- [ ] **Step 2: Run** `npx vitest run --project ui src/ui/AppLayout.test.tsx src/ui/auth`. Expected: FAIL.
- [ ] **Step 3: Implement** the four edits above.
- [ ] **Step 4: Run** `npm run lint && npm run typecheck && npm test`. Expected: pass.
- [ ] **Step 5: Commit** `Put Practice first in the navigation and after login`

### Task 4: Remembered native pick and signup prefill

**Files:**
- Create: `src/ui/visitor.ts`, `src/ui/visitor.test.ts`
- Modify: `src/ui/profile/ProfileGate.tsx`
- Test: `src/ui/profile/ProfileGate.test.tsx`

**Interfaces:**
- Produces (`src/ui/visitor.ts`):
  ```ts
  export const VISITOR_NATIVES: Lang[];                       // every supported language except "en" and "fr"
  export function loadVisitorNative(): Lang | null;           // null when missing, unreadable, unknown, "en" or "fr"
  export function saveVisitorNative(lang: Lang): void;        // never throws
  export function clearVisitorNative(): void;                 // never throws
  export function visitorLanguages(native: Lang): ProfileLanguage[];
  // [{ lang: native, region: LANGUAGES[native].defaultRegion, level: "native", position: 0 },
  //  { lang: "en", region: "CA", level: "intermediate", position: 1 },
  //  { lang: "fr", region: "FR", level: "intermediate", position: 2 }]
  ```
  One `localStorage` key, `parlo.visitor`.
- Consumes: `LanguagePicker`'s existing `initial` prop (passing three languages opens it with every slot filled and its regions shown, so one tap confirms).

- [ ] **Step 1: Write the failing tests.** `visitor.test.ts`: `"round-trips a valid pick"`; `"returns null for garbage, 'en', 'fr' and unknown codes"` (Review Focus 1); `"does not throw when storage throws"` (stub `Storage.prototype.getItem`/`setItem` to throw); `"VISITOR_NATIVES excludes en and fr and keeps the rest"`; `"visitorLanguages puts the pick first, English (CA) second, French (FR) third"`. `ProfileGate.test.tsx`: `"prefills the picker from the stored pick when the profile is empty"` (stored `"uk"`, profile `[]`: the first slot shows Українська and the others English and Français); `"shows the normal empty picker when nothing valid is stored"`; `"clears the stored pick once the profile is saved"`; `"clears a stored pick when the profile already exists"` (Review Focus 4).
- [ ] **Step 2: Run** `npx vitest run --project unit --project ui src/ui/visitor.test.ts src/ui/profile/ProfileGate.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement `visitor.ts`** per the signature (validate against `LANG_CODES`), and in `ProfileGate` read the pick **after mount** (an effect, not during render) and render the picker with `initial={visitorLanguages(native)}` only for an empty profile; clear the key on `onSaved` and whenever a complete profile is loaded.
- [ ] **Step 4: Run** `npm run lint && npm run typecheck && npm test`. Expected: pass.
- [ ] **Step 5: Commit** `Remember a visitor's native language and prefill the picker`

### Task 5: Landing game

**Files:**
- Create: `src/ui/landing/LandingGame.tsx`, `src/ui/landing/LandingGame.module.css`, `src/ui/landing/LandingGame.test.tsx`
- Modify: `src/ui/landing/LandingPage.tsx` (replace `<PracticeDemo />`, adjust hero and step copy), `src/ui/landing/LandingPage.test.tsx`
- Delete: `PracticeDemo.tsx`, `PracticeDemo.module.css`, `PracticeDemo.test.tsx` (move any card styling `LandingGame` still needs into its own module)

**Interfaces:**
- Consumes: `PracticeRound` (Task 1), `VISITOR_NATIVES`, `loadVisitorNative`, `saveVisitorNative`, `visitorLanguages` (Task 4), `BUNDLE_LOADERS.starter`, `bundleToGroups`.
- Produces: `export function LandingGame(): JSX.Element`. Two states. **Pick:** a row of pills, one per `VISITOR_NATIVES` entry, each a `<Flag>` plus the language's endonym, at least 44px. **Round:** `PracticeRound` with `source="starter"`, `count={10}`, `practice={native}`, `languages={visitorLanguages(native)}`, `groups={bundleToGroups(starter, [native, "en", "fr"])}`, `favorites={false}`, and a `finishedFooter` that invites the visitor to sign up, with a link to `/sign-in` ("Sign up to keep playing"). The footer text mentions the whole deck, the phrasebook and translating their own phrases, and never "progress". A "Change language" pill returns to the pick state. The stored pick is read after mount; until then nothing from the pick state or the round is rendered (Review Focus 5).

- [ ] **Step 1: Write the failing tests** (`renderWithProviders`; `fetch` stubbed to throw if called; `localStorage` cleared before each):
  - `"offers every language except English and French as the native pick"`.
  - `"picking Spanish starts a round with the Spanish phrase up front, no star, and no request"` (Review Focus 2); Reveal then shows the English and French phrases.
  - `"remembers the pick and starts the round on the next visit"`: with `parlo.visitor` set to `"uk"` the pills are not shown and the first card is in Ukrainian.
  - `"falls back to the picker for an invalid stored pick"` (`"en"`, garbage; Review Focus 1).
  - `"Change language returns to the picker"`.
  - `"after ten cards invites the visitor to sign up, with a link to /sign-in and no talk of progress"`: grade all 10 "Got it", expect the link, expect `queryByText(/progress/i)` null; `"Practice again"` is still there and deals another round.
  In `LandingPage.test.tsx`, drop the assertions tied to the old headline and `PracticeDemo`, and assert the new hero copy and that the hero call to action still links to `/sign-in`.
- [ ] **Step 2: Run** `npx vitest run --project ui src/ui/landing`. Expected: FAIL.
- [ ] **Step 3: Implement `LandingGame`** per the interface; load the bundle with `useQuery` using the same key as `ReviewView` (`["bundle", "starter"]`, `staleTime: Infinity`; `Providers` wraps the landing page). Draft the hero and step copy in the site's voice (practice phrases you will really hear; short, warm, plain, no emoji, no promise of saved progress); the author edits it. Keep `Conversation`, the languages grid, the closing call to action and the footer.
- [ ] **Step 4: Run** `npm run lint && npm run typecheck && npm test`. Expected: pass.
- [ ] **Step 5: Try it** (`npm run dev`), signed out and in a private window: 390px width, light and dark, reduced motion on; play a round, reload (the pick is kept), sign up with a development account (the picker arrives pre-filled).
- [ ] **Step 6: Commit** `Replace the landing demo with a playable Starter round`

---

## Self-review

- **Spec coverage:** 3.1 round without login → Task 1; 3.2 landing game, pills, defaults, remembered pick, end-of-round invitation, hero copy → Tasks 4, 5; 3.3 carry-over and clearing → Task 4; 3.4 tab order, post-login page, deal on arrival, "Setup" one tap → Tasks 2, 3; 3.5 look and feel → Global Constraints; calls 1 to 11 → Tasks 1 to 5 (call 5 star hidden: Task 1; calls 7 and 8: Task 2; call 9: Task 4; call 10: Task 5; call 11: Task 2). Section 6 order is kept.
- **Names:** `PracticeRound`, `visitorLanguages`, `loadVisitorNative`, `saveVisitorNative`, `clearVisitorNative` and `VISITOR_NATIVES` are defined once (Tasks 1, 4) and used as defined in Task 5.
- **Open choice:** the existing "Setup" button label is kept (the spec's "Change setup" names the action, not the label).
