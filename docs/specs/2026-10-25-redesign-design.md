# Parlo: Redesign (Design System Adoption)

Extends [`2026-10-09-parlo-design.md`](2026-10-09-parlo-design.md) and
[`2026-10-22-landing-page-design.md`](2026-10-22-landing-page-design.md). Supersedes the landing page spec's palette
(§3 there) and its "no per-screen restyling" non-goal.

## 1. Intent

A Claude Design session produced a design system for Parlo: tokens, a Mantine theme mapping, three components
(`Wordmark`, `Flag`, `PhraseCard`), a font setup, icons and a `CLAUDE.md` of rules. The export lives outside the repo
(`~/Downloads/parlo`) and was written for a narrower app than this one. This work adopts its look and principles into
the real app, adapting what conflicts, and makes them durable so future UI work stays on-system.

The look in one paragraph: a dark, dotted ground; phrases on solid colored cards (peach, lilac, mint), one color per
language *role*; Bricolage Grotesque for display, Instrument Sans for UI; everything pressable is a pill of at least
44 px; one primary action per screen (an inverse, light pill); elevation by surface color, not shadow; short warm
copy; line icons; small purposeful motion (rise, strike, pop, bob).

### Goals

- The whole signed-in app, sign-in page and landing page wear the new look (dark scheme first).
- The design rules live in the repo (`CLAUDE.md`) and the tokens in one file (`src/styles/tokens.css`).
- Favicon, app icons and a web manifest from the export.
- Non-Latin phrases (Cyrillic, Devanagari, Gurmukhi, Arabic, Persian, Chinese) render in a font chosen on purpose,
  not whatever the browser falls back to.
- Light scheme keeps working throughout and gets its own palette in a final pass.

### Non-goals

- Tailwind, or replacing Mantine. Styling stays Mantine + CSS Modules for bespoke surfaces (the export's own advice).
- The export's `languages.ts` and `Flag.tsx`. The app already has 13 languages with regions
  (`src/shared/languages.ts`) and circle flag SVGs (`public/flags`, `src/ui/Flag.tsx`).
- The "Literally …" line on `PhraseCard` (struck-through serif). The app stores no literal translation; adding one is
  a model, prompt and schema change and is a separate project. Until then Instrument Serif is not loaded.
- Listen (text-to-speech) buttons on cards. No TTS exists.
- New features or behavior changes. Routes, API, data and tests of behavior stay as they are.

### Anti-goals (a failure even if it technically works)

- Hex values or one-off colors in components; a fourth language color; white text on a language color.
- Two competing visual systems in the app (half the screens restyled and merged). Each merge to `main` must leave
  every screen coherent, so tokens and theme land first and screens follow in one pass each.
- Light mode left broken at any merge. It may look plainer than dark, but must be readable and AA-contrast.
- Mojibake or tofu for any supported language in phrase cards.

## 2. What differs between the export and the app (and the call made)

| Topic | Export | App today | Decision |
|---|---|---|---|
| Color scheme | Dark only, forced | `auto` light/dark | Keep both (user's call). Dark first; light in the last task. |
| Language roles | Native=peach, English=lilac, French=mint, fixed per language | Any 3 of 13 languages; profile position 0 is native | **Role follows profile position**: 1st (native) peach, 2nd lilac, 3rd mint. Colors name the role, not the language. (My call.) |
| Language list, variants, flags | 14 hard-coded variants | `LANGUAGES` + regions, flags by region | Keep the app's. Add an optional role ring to `Flag`. |
| Fonts | Bricolage, Instrument Sans, Instrument Serif | Geist, Geist Mono | Bricolage + Instrument Sans, plus per-script fallbacks (§4). Geist removed; Geist Mono dropped if unused. |
| Navigation | Bottom nav, pill chips | `AppShell` header + sidebar + burger | Phone: bottom nav. Desktop: keep a left rail, restyled. (My call.) |
| Buttons | Filled = inverse pill, default = secondary, outline = ghost | Mantine default filled in accent | Adopt the export's mapping in the theme. |
| Google sign-in button | n/a | Own `google` variant | Keep as is. Google's branding wins. |
| `CLAUDE.md` | Rules file | None (only `AGENTS.md`) | Add `CLAUDE.md` adapted to this repo (§5). |

## 3. Tokens, theme and scheme handling

- `src/styles/tokens.css` is the single source of design values, `--parlo-*` names as in the export. It is imported
  once from `src/app/layout.tsx`.
- Dark values are the export's. The same file holds a `:root[data-mantine-color-scheme="light"]` block that is
  empty at first and filled in the light task. Components only ever read `--parlo-*`, so the scheme swap needs no
  component changes.
- `src/ui/theme.ts` takes the export's theme (dark scale, `native` / `english` / `french` color tuples, radius scale,
  pill button mapping) and **keeps** what the app needs that the export lacks: the `google` variant, the 16 px input
  size defaults, and the rule that this file stays importable from server code (the preview image) so plain objects,
  not `Component.extend(...)`.
- Between the first merge and the light task the app **forces dark** (`defaultColorScheme="dark"` and
  `ColorSchemeScript`), so no one sees an unstyled light mode. The light task switches it back to `auto`.
- The export's body dot-grid background and the reduced-motion rule move to a global stylesheet imported with the
  tokens.

## 4. Fonts

Decided after a specimen of Bricolage with several fallback stacks (Task 0): the options looked alike, so the
choice is the one that downloads the fewest fonts.

- Latin: Bricolage Grotesque (display: wordmark, phrases, headings; weights up to 800) and Instrument Sans (UI;
  weights up to 700), loaded with `next/font/google` as CSS variables. Instrument Serif is not loaded (see non-goals).
- Cyrillic: Instrument Sans and Bricolage have none, and Ukrainian can be a user's native language, so one extra
  family is loaded: Onest (variable, `cyrillic` and `latin` subsets), placed after the Latin fonts in both stacks.
- Hindi, Punjabi, Arabic, Persian, Chinese: no download. The stacks end in system fonts that name each
  platform's own: `"Nirmala UI"` (Devanagari, Gurmukhi, Windows), `"Segoe UI"`, `"Noto Sans"` (Android, Linux),
  then `system-ui, sans-serif`. Apple platforms resolve these scripts through `system-ui`.
- Known cost: non-Latin text differs a little per device, and Windows has fewer weights, so 800 renders as bold.
  Not tested on Windows or Android by us. If a script looks poor on a real device, add its Noto font then
  (`Noto Sans Devanagari`, `Gurmukhi`, `Arabic` are all available in `next/font/google`).
- Phrase elements keep `lang` and `dir="auto"` (already true in the app; the card rewrite must not drop them).

## 5. `CLAUDE.md`

A new root `CLAUDE.md` carries the export's rules, adapted to the decisions above: Mantine + CSS Modules, no Tailwind,
tokens only, roles by profile position, pill controls at least 44 px, one primary action per screen, fonts, motion and
reduced motion, copy tone, "reuse `Wordmark`, `Flag`, `PhraseCard` first", plus a pointer to `AGENTS.md` for the
Next.js warning and to the docs conventions (`docs/specs`, `docs/plans`). It states that dark is the reference scheme
and light is derived from it. It does not repeat anything the code already says (file lists, stack versions).

## 6. Components and screens

Shared pieces go in `src/ui/` with a `.module.css`, next to the existing components (the app has no
`src/components/ui`; the export's paths do not apply).

- **Wordmark** (new): "parlo" and the three bobbing dots. Used in the header, sign-in, landing and rail.
- **Flag** (existing): gains an optional `ring` prop (role color). API otherwise unchanged.
- **Role helper** (new): `roleFor(position)` returning `"native" | "english" | "french"`, and the viewer's
  languages mapped to roles from the profile. Pure and unit-tested.
- **PhraseCard** (existing, rewritten): colored by role, flag + endonym label, phrase in display font,
  copy and favorite actions as 44 px round buttons. `lang` and `dir="auto"` kept. `rise` motion with stagger.
  Props change from `{ phrase }` to `{ phrase, role }`.
- **Layout**: phone: header with wordmark, usage badge and user menu, bottom navigation (Translate, History,
  Phrasebook). Desktop (900 px and up): left rail and a centered column; result cards in a grid.
- **Screens**, one pass each, in this order: Translate (form, result, correction alert), History, Phrasebook and
  review, Profile (language picker), sign-in, landing and its preview image.
- **Identity assets**: `favicon.ico` and `apple-icon.png` in `src/app` (Next file conventions), a
  `manifest.ts` using `icon-192.png` and `icon-512.png` from `public/`, and a `theme-color` viewport entry.

## 7. Constraints

- No new dependencies beyond `next/font` families. Read `node_modules/next/dist/docs/` before touching fonts,
  metadata, manifest or icon conventions (`AGENTS.md`).
- Existing tests keep passing. UI tests that assert on markup or text may be updated, never deleted.
- `src/ui/theme.ts` stays importable from server code.
- Contrast: text on each role color and on every surface meets WCAG AA (4.5:1); the existing `contrast.ts` helper
  and `theme.test.ts` pattern are extended to the new tokens.
- Respect `prefers-reduced-motion` everywhere the new motion is used.
- Every merge to `main` deploys; each task is mergeable on its own.

## 8. Left to the builder

- Exact component markup and CSS inside the constraints above.
- Bottom-nav and rail visuals, as long as they follow the tokens and the 44 px rule.
- Light palette values (Task 8), derived from dark and verified for AA. The export's `-deep` colors are meant for
  light surfaces and are the starting point.

## 9. Open for the author

- Final decision on desktop navigation (rail vs. top tabs) after seeing the phone layout. Default: rail.
- Whether to keep Geist Mono if any code view uses it. Default: drop it if grep shows no use.

## 10. Second design pass (desktop layout, profile, landing)

After the first merge the author shared the full canvas from the design session (a Claude Design artifact with
phone screens, a desktop Translate screen, a Profile screen and a long landing page) and asked to apply its layout
while keeping the app's own page names (Translate, History, Phrasebook; the design calls them Translate, Saved,
Practice).

- **Navigation:** on desktop the three links move into the header as pills (active = the inverse pill), and the left
  rail goes away. Phone keeps the fixed bottom bar, its active item also the inverse pill. Profile stays reachable
  from the avatar menu.
- **Width:** the content column grows from 960 to 1160px on desktop.
- **Translate:** two columns from 900px: the phrase card on the left (large display-font textarea, one primary
  pill), the translations stacked on the right. A strip shows the viewer's three languages (ringed flags, a link to
  Profile). The "Literally" line stays out: there is no data for it.
- **Profile:** the design's accordion: an account header, then one expandable row per language slot (role label,
  ringed flag, name and country), each opening to language chips and country chips. The app's rules stay: any of
  13 languages in any slot, three distinct languages, region only where the app asks for it, the same Save.
- **Landing:** the design's page replaces the current one: header with Sign in and a Google button, hero with the
  rotating three-card conversation (the existing phrase sets, no literal line), a "practice" section with a small
  interactive card deck, a section on the languages the app supports, a closing call to action and a footer. Copy
  follows the design except where it would promise something the app does not do (Apple and email sign-in are left
  out: the app only has Google; the Privacy, Terms and Contact placeholders are left out). Google sign-in and the
  link preview keep working as today.
- **Out of scope:** speech input, listen buttons, the "Literally" line, the design's separate Practice screen
  (the app's Review stays as it is, restyled by the first pass).
