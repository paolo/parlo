# Landing Page Implementation Plan

> **For agentic workers:** Execute with superpowers:executing-plans (native, inline; the user chose this mode for
> Parlo). Steps use checkbox (`- [ ]`) syntax. Tick them as you go.

**Goal:** Show signed-out visitors at `parlo.fun/` a landing page with a rotating three-language phrase and the
Google sign-in button, with every color and general style decision living in the Mantine theme.

**Architecture:** The look (palette, surfaces, headings, Google button variant) is added to `src/ui/theme.ts`, so the
landing page and the app share it. Landing content is typed data; rotation is a small hook; the page is a handful
of Mantine-based components under `src/ui/landing`. `src/proxy.ts` rewrites `/` to a `/welcome` route when there is
no session cookie.

**Tech Stack:** Next.js 16 (proxy, metadata API), TypeScript, Mantine 9 (`@mantine/hooks` for timers and
reduced-motion), Vitest + RTL, Biome. No new dependencies.

**Spec:** [`docs/specs/2026-10-22-landing-page-design.md`](../specs/2026-10-22-landing-page-design.md)

**Branching:** one branch, `landing-page` (it already holds the spec commits), atomic commits per step group, one
`git merge --no-ff` at the end ("Merge landing page") after the user approves. Every merge to `main` deploys, and the
content must be reviewed first (Task 7 is a gate).

## Global Constraints

- Headline "Three languages. One meaning."; subline "Understand what people really say, and say what you mean
  like they would."; button label "Continue with Google"; no footer line. All page text stays in English.
- Conversation order: native (left), English (right), French (left). Column about 460 px, centered; bubbles at most
  about 80% of the column. Rotation about every 5 s; all three bubbles change together; native cycle is
  `es, pt, uk, zh, hi, pa`; English and French never rotate.
- No flags, maple leaves, emoji, mascot or confetti anywhere.
- All colors and general styling in `src/ui/theme.ts`. Components use theme tokens and Mantine style props; no
  hard-coded hex values and no new CSS files in components.
- Palette starting values. Light: body `#f4f5fb`, text `#1d2033`, dimmed `#6b7090`, accent shade 6 `#4c5fd5`,
  surfaces white. Dark: body `#14162a`, text `#eceefb`, dimmed `#8d93b8`, accent shade 4 `#8f9cf5`, surfaces
  `#21244a`. Text must meet WCAG AA contrast in both schemes.
- Google button follows Google's branding: light fill `#FFFFFF`, stroke `#747775`, text `#1F1F1F`; dark fill
  `#131314`, stroke `#8E918F`, text `#E3E3E3`; four-color "G" artwork inlined as SVG; CSS-only scheme swap.
- Every phrase element has the right `lang` (`zh` as `zh-Hans`) and `dir="auto"`. Every phrase is at most
  40 characters.
- The landing page makes no API calls. The signed-in app at `/` and every other route behave as today.
- No new dependencies. Read `node_modules/next/dist/docs/` before touching proxy or metadata APIs (`AGENTS.md`).
- Commits: one title line, imperative, capitalized, no prefix, no body, no trailers (`~/.claude/CLAUDE.md`).
- Verify each task with `npm run lint`, `npm run typecheck` and `npm test`.

## Review Focus

1. A signed-out request to `/phrasebook` (or any non-root path) still redirects to `/sign-in`; only `/` shows the
   landing page, and a signed-in request to `/` still reaches the app (Task 5).
2. The longest phrase at a 320 px viewport must not change the conversation's height between rotations, so nothing
   below it moves (Tasks 2 and 7).
3. With reduced motion or a hidden tab the timer never advances; tapping or pressing Enter/Space still does (Task 3).
4. Text contrast stays AA in both schemes, and the existing app screens and tests survive the theme change
   (Tasks 1 and 7).
5. A browser with JavaScript off still shows the first conversation (server-rendered), and CJK, Devanagari and
   Gurmukhi text renders with the right glyphs (Tasks 4 and 7).

---

### Task 1: Theme

**Files:**
- Modify: `src/ui/theme.ts`, `src/ui/theme.test.ts`

**Interfaces:**
- Produces:
  - `theme` keeps its export. It gains `colors.parlo` (10-shade accent scale, shade 6 `#4c5fd5`, shade 4
    `#8f9cf5`), a tinted `colors.dark` scale (index 0 `#eceefb`, 2 `#8d93b8`, 6 `#21244a`, 7 `#14162a`),
    `primaryColor: "parlo"`, `primaryShade: { light: 6, dark: 4 }`, heading weight 800 with tight letter spacing,
    and a `cssVariablesResolver` setting the light-scheme `--mantine-color-body` `#f4f5fb`,
    `--mantine-color-text` `#1d2033`, `--mantine-color-dimmed` `#6b7090`. Light surfaces (Paper, Card) are white
    and dark ones come from `dark[6]`, set through the theme.
  - `variantColorResolver` that handles a custom Button variant `"google"` and otherwise delegates to
    `defaultVariantColorResolver`. Its colors are the Google values above, with the light and dark values joined
    by CSS `light-dark()`.
  - `export function contrastRatio(foreground: string, background: string): number` in
    `src/ui/contrast.ts` (WCAG relative-luminance ratio), used by the theme tests.
- Consumes: nothing.

- [ ] **Step 1: Write failing tests.** `contrast.test.ts`: black on white is 21; `#777` on white is about 4.48.
  `theme.test.ts` (keep the existing 16px test): `theme.primaryColor` is `"parlo"`; `theme.colors.parlo` has 10
  entries with `[6] === "#4c5fd5"` and `[4] === "#8f9cf5"`; calling `theme.cssVariablesResolver(theme)` gives the
  light body/text/dimmed values above; `contrastRatio` of text on body and of dimmed on body is at least 4.5 in
  both schemes, and of the accent on body at least 4.5 (shade 6 on light body, shade 4 on dark body);
  `theme.variantColorResolver({ variant: "google", theme, color: "gray" })` returns a `background` containing
  `#FFFFFF` and `#131314` and a `color` containing `#1F1F1F` and `#E3E3E3`.
- [ ] **Step 2:** `npx vitest run --project unit --project ui src/ui/theme src/ui/contrast` — expect FAIL.
- [ ] **Step 3:** Implement `contrastRatio` and the theme additions. Generate the intermediate `parlo` shades
  around the two anchors and fix any shade the contrast tests reject.
- [ ] **Step 4:** Run the same command — expect PASS; then `npm test` to confirm the existing UI tests still pass.
- [ ] **Step 5:** Run `npm run dev`, sign in with the development password form, and look at Translate, History,
  Phrasebook, Review and Profile in light and dark. Fix anything the theme change visibly breaks inside the theme
  (not per screen). Note any exception in the plan.
- [ ] **Step 6:** Commit "Add the Parlo palette to the Mantine theme".

### Task 2: Landing content

**Files:**
- Create: `src/ui/landing/phrases.ts`, `src/ui/landing/phrases.test.ts`

**Interfaces:**
- Produces:
  - `type NativeLang = "es" | "pt" | "uk" | "zh" | "hi" | "pa"` and `const NATIVE_CYCLE: readonly NativeLang[]`
    in that order
  - `interface PhraseSet { id: string; canadian: boolean; meaning: string; phrases: Record<NativeLang | "en" | "fr", string> }`
    (`meaning` is a short English gloss for assistive technology)
  - `const PHRASE_SETS: readonly PhraseSet[]` (first entry is the "very cold" set from the spec)
  - `function conversationAt(step: number): { set: PhraseSet; native: NativeLang }` (wraps both cycles
    independently using the step number)

- [ ] **Step 1: Write failing tests.** Every set has non-empty trimmed strings for all eight languages; every
  language code is a key of `LANGUAGES` in `src/shared/languages.ts`; every phrase is at most 40 characters; ids
  are unique; `conversationAt(0)` is the first set with `es`; `conversationAt(6).native` is `"es"` again;
  `conversationAt(PHRASE_SETS.length).set` is the first set.
- [ ] **Step 2:** `npx vitest run --project unit src/ui/landing/phrases` — expect FAIL.
- [ ] **Step 3:** Implement the module with the first set only: fr "Il fait frette", en "It's freezing out", es
  "Hace un frío que pela", uk "Дубак надворі"; draft pt, zh (Simplified), hi and pa as idioms of the same meaning.
- [ ] **Step 4:** Run the same command — expect PASS.
- [ ] **Step 5:** Commit "Add the landing page phrase content".

### Task 3: Rotation hook

**Files:**
- Create: `src/ui/landing/useRotation.ts`, `src/ui/landing/useRotation.test.tsx`

**Interfaces:**
- Produces: `function useRotation(options?: { intervalMs?: number }): { step: number; advance: () => void; pauseProps: { onMouseEnter: () => void; onMouseLeave: () => void; onFocus: () => void; onBlur: () => void } }`
  with `intervalMs` defaulting to 5000. `step` starts at 0.
- Consumes: `useReducedMotion`, `useDocumentVisibility` and `useInterval` from `@mantine/hooks`.

- [ ] **Step 1: Write failing tests** with fake timers: advances one step per interval; does not advance while
  `pauseProps.onMouseEnter` is active, and resumes after `onMouseLeave`; same for focus and blur; does not advance
  while `document.visibilityState` is `hidden`; does not advance when `prefers-reduced-motion` matches; `advance()`
  moves one step in every case.
- [ ] **Step 2:** `npx vitest run --project ui src/ui/landing/useRotation` — expect FAIL.
- [ ] **Step 3:** Implement the hook (stub `matchMedia` and `visibilityState` in the test as needed).
- [ ] **Step 4:** Run the same command — expect PASS.
- [ ] **Step 5:** Commit "Add the landing rotation hook".

### Task 4: Conversation and bubbles

**Files:**
- Create: `src/ui/landing/PhraseBubble.tsx`, `src/ui/landing/Conversation.tsx`,
  `src/ui/landing/Conversation.test.tsx`

**Interfaces:**
- Produces:
  - `PhraseBubble({ lang, label, text, side }: { lang: string; label: string; text: string; side: "left" | "right" })`
    built on Mantine `Paper` (shadow, `bdrs` for the small-radius tail corner), `Text` for the label (`c="parlo"`)
    and the phrase (`lang`, `dir="auto"`, fixed minimum height for two lines)
  - `Conversation()` — a client component that uses `useRotation` and `conversationAt`, renders the three bubbles
    (native left, `en` right, `fr` left) in a centered `Stack` of max width 460 px, crossfades when the step
    changes, and exposes the whole conversation as one `button` (accessible name from `meaning`) that calls
    `advance` on click, Enter and Space; no live region
- Consumes: `conversationAt`, `useRotation`.

- [ ] **Step 1: Write failing tests** (RTL): initial render shows the first set with labels `ES`, `EN`, `FR` in that
  DOM order; the bubbles carry `lang="es"`, `"en"`, `"fr"` and a Mandarin conversation carries `lang="zh-Hans"`;
  clicking the conversation shows the next conversation (native `pt`); pressing Enter does too; with fake timers
  the conversation changes after 5 s; there is no element with `aria-live`.
- [ ] **Step 2:** `npx vitest run --project ui src/ui/landing/Conversation` — expect FAIL.
- [ ] **Step 3:** Implement both components. Server-render step 0 so the first conversation exists without
  JavaScript.
- [ ] **Step 4:** Run the same command — expect PASS.
- [ ] **Step 5:** Commit "Add the landing conversation".

### Task 5: Google button, landing page and routing

**Files:**
- Create: `src/ui/auth/GoogleSignInButton.tsx`, `src/ui/auth/GoogleSignInButton.test.tsx`,
  `src/ui/landing/LandingPage.tsx`, `src/ui/landing/LandingPage.test.tsx`, `src/app/welcome/page.tsx`,
  `src/proxy.test.ts`
- Modify: `src/ui/auth/SignInForm.tsx`, `src/proxy.ts`

**Interfaces:**
- Produces:
  - `GoogleSignInButton()` — Mantine `Button` with `variant="google"` and `size="md"`, leading inlined four-color
    "G" SVG, label "Continue with Google", `onClick` →
    `authClient.signIn.social({ provider: "google", callbackURL: "/" })`
  - `LandingPage()` — top bar (wordmark "parlo" and a "Sign in" button that starts the same Google flow),
    headline (`Title`), subline (`Text c="dimmed"`), `Conversation`, `GoogleSignInButton`; uses the theme only
  - `src/app/welcome/page.tsx` renders `LandingPage` (metadata comes in Task 6)
  - `proxy(request)`: no session cookie and `pathname === "/"` → `NextResponse.rewrite(new URL("/welcome", request.url))`;
    no cookie on any other matched path → redirect to `/sign-in` as today; cookie present → `next()`
- Consumes: `Conversation`, theme variant `google`.

- [ ] **Step 1: Write failing tests.** `GoogleSignInButton.test.tsx`: clicking calls `authClient.signIn.social`
  with `{ provider: "google", callbackURL: "/" }`. `LandingPage.test.tsx`: the headline and subline texts from the
  Global Constraints are present, and there is a "Continue with Google" button. `proxy.test.ts` (build requests
  with `NextRequest`): no cookie at `/` rewrites to `/welcome`; no cookie at `/phrasebook` redirects to
  `/sign-in`; a session cookie at `/` calls through. Keep the existing `SignInForm` tests unchanged (they must
  pass against the new button).
- [ ] **Step 2:** `npx vitest run --project unit --project ui src/ui/auth src/ui/landing src/proxy` — expect FAIL.
- [ ] **Step 3:** Implement. Replace the button in `SignInForm.tsx` with `GoogleSignInButton`. Read the Next.js
  proxy docs first for the rewrite API and the matcher (the matcher already excludes `sign-in`; do not add
  `welcome` to the exclusions).
- [ ] **Step 4:** Run the same command, then `npm test` — expect PASS.
- [ ] **Step 5:** Run `npm run dev`; signed out, `/` shows the landing page at URL `/`; signed in, `/` shows the
  app; `/phrasebook` signed out redirects to `/sign-in`.
- [ ] **Step 6:** Commit "Add the landing page" (add the proxy and sign-in changes in their own commits if they
  read better).

### Task 6: Metadata

**Files:**
- Modify: `src/app/welcome/page.tsx`
- Create: `src/app/welcome/metadata.test.ts` (only if the metadata is exported separately enough to test)

**Interfaces:**
- Produces: landing `metadata` with a title and description about the idea ("Understand and use colloquial
  phrases across your three languages"), `openGraph` and `twitter` (summary large image) pointing at the image
  from Task 7, and `metadataBase` from the existing `BETTER_AUTH_URL` origin.

- [ ] **Step 1:** Write a test that the exported metadata has the description text and `twitter.card ===
  "summary_large_image"`.
- [ ] **Step 2:** Run it — expect FAIL. **Step 3:** Implement. **Step 4:** Run it — expect PASS.
- [ ] **Step 5:** Commit "Add landing page metadata".

### Task 7: Remaining content, preview image and release gate

**Files:**
- Modify: `src/ui/landing/phrases.ts`
- Create: `src/app/welcome/opengraph-image.png`

- [ ] **Step 1:** Add seven more phrase sets (about half Canadian, e.g. "Give'r", "Ça marche", "Take a rain check"),
  each idiomatic in all eight languages and at most 40 characters. The Task 2 tests must pass.
- [ ] **Step 2:** Run the app and check the conversation does not change height across all 8×6 combinations at a
  320 px viewport (browser, light and dark), with JavaScript disabled once (first conversation visible), and with
  reduced motion on.
- [ ] **Step 3:** Produce the 1200×630 `opengraph-image.png` (headline plus the first conversation, light scheme)
  and confirm the page's `og:image` URL resolves.
- [ ] **Step 4: Gate.** Stop and ask the user to review all phrases (or have fluent speakers review) and the
  preview image. Apply their corrections, re-run `npm run lint && npm run typecheck && npm test`, and run
  `npm run build`.
- [ ] **Step 5:** Commit "Add the remaining landing phrases" and "Add the landing preview image".
- [ ] **Step 6:** After the user approves, `git merge --no-ff landing-page` into `main` with "Merge landing page".
