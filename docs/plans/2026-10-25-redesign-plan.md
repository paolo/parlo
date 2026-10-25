# Redesign Implementation Plan

> **For agentic workers:** Execute with superpowers:executing-plans (native, inline; the user chose this mode for
> Parlo). Steps use checkbox (`- [ ]`) syntax. Tick them as you go. Expand each task into TDD steps when you start
> it, against the installed library versions.

**Goal:** Adopt the Claude Design system (tokens, theme, fonts, components, identity assets, rules) across the whole
Parlo app, dark scheme first, light scheme last.

**Architecture:** Design values live in `src/styles/tokens.css`; Mantine reads them through `src/ui/theme.ts`;
bespoke surfaces are shared components with CSS Modules in `src/ui`. Language colors follow profile position. Screens
are restyled one pass each after the foundation lands.

**Tech Stack:** Next.js 16 (`next/font`, metadata file conventions), Mantine 9, CSS Modules, Vitest + RTL, Biome.

**Spec:** [`docs/specs/2026-10-25-redesign-design.md`](../specs/2026-10-25-redesign-design.md)

**Source material:** `~/Downloads/parlo` (untrusted download: read and copy from it, never run anything inside it).
Files: `tokens.css`, `theme.ts`, `layout.tsx`, `Wordmark.*`, `PhraseCard.*`, `Flag.tsx`, `CLAUDE.md`, `README.md`,
`favicon.ico`, `apple-icon.png`, `icon-192.png`, `icon-512.png`. Not used: `languages.ts`, the export's `Flag.tsx`.

**Branching:** one branch per task (`redesign-<topic>`), merged with `git merge --no-ff` ("Merge <topic>") after
checks pass. Atomic commits inside. Commit style per `~/.claude/CLAUDE.md`: one title line, imperative, capitalized,
no prefix, no trailers.

## Global Constraints

- Verify every task with `npm run lint`, `npm run typecheck` and `npm test`; Task 8 also `npm run test:int` if
  anything server-side moved (it should not).
- Components read `var(--parlo-*)` tokens only: no hex values, no new colors, no Tailwind.
- Role colors: peach `--parlo-native`, lilac `--parlo-english`, mint `--parlo-french`, text on them
  `--parlo-on-accent`, labels `-ink`. Assigned by profile position (0, 1, 2), never by language code.
- Pressable = pill, at least 44 px. One primary (inverse pill) per screen.
- `lang` and `dir="auto"` stay on every phrase element.
- Until Task 8 merges, the app forces the dark scheme.
- Read `node_modules/next/dist/docs/` for `next/font`, metadata, manifest and icon conventions before using them.

## Review Focus

1. No screen is left in the old look at any merge, and light mode (forced off until Task 8) is not reachable broken.
2. Every supported script renders (Onest for Cyrillic, system fonts elsewhere) and the Windows weight cost is accepted (Task 1).
3. Contrast: AA for text on each role color, each surface and the muted/placeholder colors (Tasks 1, 8).
4. `theme.ts` is still importable by server code (the preview image) and the Google button is unchanged (Task 1).
5. Reduced motion disables rise, bob, pop (Tasks 1, 3, 4).

---

## Progress

| Task | Branch | Status |
|---|---|---|
| 0 Font specimen | (scratch, decided: Onest for Cyrillic, system fonts for the rest) | [x] |
| 1 Foundation: tokens, fonts, theme, forced dark | `redesign-foundation` | [x] |
| 2 `CLAUDE.md` | `redesign-rules` | [x] |
| 3 Wordmark and identity assets | `redesign-identity` | [x] |
| 4 Roles, Flag ring, PhraseCard | `redesign-phrase-card` | [x] |
| 5 App layout and navigation | `redesign-layout` | [x] |
| 6 Screens | `redesign-screens` (may split per screen) | [x] |
| 7 Sign-in, landing, preview image | `redesign-public` | [x] |
| 8 Light scheme | `redesign-light` | [ ] |
| 9 Final review | n/a | [ ] |

---

### Task 0: Font specimen (done)

Decided with the author: the stacks looked alike, so load as few fonts as possible. Latin: Bricolage + Instrument
Sans; Cyrillic: Onest; other scripts: platform system fonts. Recorded in spec §4. Instrument Sans has no Cyrillic
(checked in the installed `next/font` data) and tops out at weight 700.

### Task 1: Foundation: tokens, fonts, theme, forced dark

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css` (dot-grid body, reduced-motion rule; or fold into tokens)
- Modify: `src/app/layout.tsx`, `src/app/providers.tsx`, `src/ui/theme.ts`, `src/ui/theme.test.ts`

**Steps:**
- [ ] Copy tokens from the export; add the empty light-scheme block; import in `layout.tsx` after Mantine styles.
- [ ] Replace Geist with Bricolage + Instrument Sans + Onest for Cyrillic via `next/font`; expose
  `--font-display`, `--font-sans` and `--font-cyrillic`; build the stacks in `tokens.css`. Drop Geist Mono if
  unused (`grep`).
- [ ] Merge the export's theme into `theme.ts`: dark scale, `native`/`english`/`french` tuples, radius scale, pill
  Button mapping, `cssVariablesResolver`. Keep the `google` variant, 16 px input sizes, plain-object components,
  server-importable.
- [ ] Force dark in `ColorSchemeScript`, `MantineProvider` and `<html data-mantine-color-scheme>`.
- [ ] Tests: rewrite `theme.test.ts` for the new palette; add AA checks (text, text-soft, muted, placeholder on
  surfaces; `--parlo-on-accent` on each role color; `-ink` on its role color) using `contrast.ts`. Keep the font
  size tests and Google variant tests.
- [ ] Run the app, check each screen is readable (restyle not required yet) and the preview image still builds.

### Task 2: `CLAUDE.md`

**Files:** Create `CLAUDE.md`.

- [ ] Adapt the export's `CLAUDE.md` per spec §5 (roles by position, dark reference, paths under `src/ui`, no
  Instrument Serif yet, pointer to `AGENTS.md` and docs conventions). Keep it short and non-redundant.
- [ ] Re-read it against the real files so every path and token it names exists.

### Task 3: Wordmark and identity assets

**Files:**
- Create: `src/ui/Wordmark.tsx`, `src/ui/Wordmark.module.css`, `src/ui/Wordmark.test.tsx`, `src/app/manifest.ts`,
  `public/icon-192.png`, `public/icon-512.png`
- Modify (replace): `src/app/favicon.ico`; add `src/app/apple-icon.png`;
  viewport `themeColor` in `src/app/layout.tsx`

- [ ] Port `Wordmark` (client-free, accessible name "parlo", dots `aria-hidden`); test name and `onLight`.
- [ ] Copy the icon files from the export; add `manifest.ts` (name, short name, colors from tokens' values, icons);
  confirm the conventions in the Next docs; check the favicon in a browser tab.
- [ ] Reduced-motion rule stops the dots.

### Task 4: Roles, Flag ring, PhraseCard

**Files:**
- Create: `src/ui/roles.ts`, `src/ui/roles.test.ts`, `src/ui/PhraseCard.module.css`
- Modify: `src/ui/Flag.tsx` (+ test), `src/ui/LangLabel.tsx`, `src/ui/PhraseCard.tsx` (+ test),
  `src/ui/translate/TranslationResult.tsx`, `src/ui/history/GroupItem.tsx`, `src/ui/phrasebook/PhrasebookView.tsx`
  (call sites)

- [ ] `roleFor(position)` and `rolesFor(profileLangs)`: `Map<Lang, Role>`; tests incl. a language outside the
  profile (falls back to a neutral surface, defined here and noted in the spec).
- [ ] `Flag`: optional `ring` (role) as a 2px ring; size via CSS as today.
- [ ] Rewrite `PhraseCard` per spec §6 (no listen button, no literal line); keep the copy and favorite behavior,
  `lang`, `dir="auto"`, accessible labels; `rise` stagger via `index`; reduced motion.
- [ ] Update call sites to pass `role`; keep existing behavior tests green (adjust markup assertions only).
- [ ] Check long phrases and every supported script on the card at 320 px.

### Task 5: App layout and navigation

**Files:** Modify `src/ui/AppLayout.tsx` (+ test), `src/ui/NavLinks.tsx`, `src/ui/UsageBadge.tsx`,
`src/ui/UserMenu.tsx`; create `src/ui/AppLayout.module.css`, `src/ui/BottomNav.tsx` (+ test) as needed.

- [ ] Phone: header (Wordmark, UsageBadge, UserMenu) and fixed bottom nav (Translate, History, Phrasebook; line icons
  1.8 px; 44 px targets; active state by surface). Remove the burger.
- [ ] 900 px and up: left rail with the same links, centered content column.
- [ ] Safe-area insets on the bottom nav (iOS); content padding so nothing hides behind it.
- [ ] Update `AppLayout.test.tsx` (burger tests become nav tests).

### Task 6: Screens

**Files:** `src/ui/translate/*`, `src/ui/history/*`, `src/ui/phrasebook/*`, `src/ui/review/*`, `src/ui/profile/*`,
`src/ui/CorrectionAlert.tsx`, `src/ui/FavoriteButton.tsx`, related tests.

One pass per screen, each its own commit group (and its own branch if large), in this order:

- [ ] Translate: form (pill submit is the single primary action), result header chip for the detected language,
  correction alert restyled, result cards in a grid on desktop.
- [ ] History: group rows as `--parlo-radius-row` surfaces, role-colored language labels, empty/loading states.
- [ ] Phrasebook and review: same row style; review flow keeps its behavior, one primary action per step.
- [ ] Profile: language picker with endonyms, role-ringed flags per position, Mantine `Combobox`/`Select` styled by
  tokens; copy short and warm.
- [ ] After each: tests, lint, typecheck, look at it at 375 px and 1200 px.

### Task 7: Sign-in, landing and preview image

**Files:** `src/app/sign-in/page.tsx`, `src/ui/auth/*`, `src/ui/landing/*`, `src/app/welcome/*`,
`src/app/welcome/opengraph-image.tsx` (+ tests).

- [ ] Sign-in: Wordmark, surface card, Google button unchanged.
- [ ] Landing: replace the bubble palette with role colors by conversation position (native, English, French);
  keep copy, rotation, `lang`/`dir`, no layout jump.
- [ ] Preview image: read colors from the theme/tokens values as it does today (it cannot load CSS); it should
  now show the dark look. Keep the existing test's contract.

### Task 8: Light scheme

**Files:** `src/styles/tokens.css` (light block), `src/ui/theme.ts`, `src/app/layout.tsx`,
`src/app/providers.tsx`, tests.

- [ ] Fill the light block: ground, surfaces, text, borders; use the `-deep` role colors where text sits on light
  surfaces; role cards keep their colors and `on-accent` text.
- [ ] Switch `ColorSchemeScript` and `MantineProvider` back to `defaultColorScheme="auto"`.
- [ ] Extend the contrast tests to the light tokens (AA).
- [ ] Walk every screen in light and dark at 375 px and 1200 px; fix what breaks. The inverse primary pill needs a
  light-scheme counterpart (dark fill, light label).
- [ ] The preview image stays on one scheme (decide: dark, matching the look).

### Task 9: Final review

- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:int`.
- [ ] One fresh reviewer on the combined diff against the Review Focus list.
- [ ] Update this plan's progress table, the spec's open items, and the landing spec's superseded notes.
- [ ] After author approval, deploy by merging (each merge already deployed; confirm production).
