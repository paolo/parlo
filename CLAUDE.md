@AGENTS.md

## Design system (parlo)

UI follows the parlo design system. Before any UI change, read `src/styles/tokens.css`, `src/ui/theme.ts` and the shared components in `src/ui/` (`Wordmark`, `Flag`, `PhraseCard`). The redesign is specified in `docs/specs/2026-10-25-redesign-design.md` and tracked in `docs/plans/2026-10-25-redesign-plan.md`.

Rules:
- Styling: Mantine v9 components plus CSS Modules for bespoke surfaces. No Tailwind, no hex values in components, no new colours. Use `var(--parlo-*)` tokens only. A new value goes into `tokens.css` first.
- Dark is the reference scheme and light is derived from it. Ground is `--parlo-ground`; elevation is surface colour, not shadow (`--parlo-shadow-card` is reserved for the front practice card).
- Three language roles, assigned by profile position, never by language code: first (native) = peach `--parlo-native`, second = lilac `--parlo-english`, third = mint `--parlo-french`. The token names come from the original Spanish/English/French design; they name the role. Text on them is `--parlo-on-accent`, labels use the matching `-ink` token. Never white text on a role colour.
- A language is shown as its circular `<Flag>` plus its own name (endonym), with an optional 2px ring in the role colour. Never a flag alone.
- Fonts: display = Bricolage Grotesque (wordmark, phrases, headings), sans = Instrument Sans (UI), Onest for Cyrillic. Other scripts use system fonts. Phrase elements keep `lang` and `dir="auto"`.
- Everything pressable is a pill, at least 44px. One primary action per screen (Mantine `filled` = the inverse pill; `default` = secondary; `outline` = ghost).
- Motion: rise, strike, pop, bob, deal (timings in `tokens.css`). Always respect `prefers-reduced-motion`.
- Copy: short, warm, plain. Language names in their own language in pickers. No emoji; 1.8px stroke line icons.
- Reuse `Wordmark`, `Flag` and `PhraseCard` before building anything new. New shared pieces go in `src/ui/` with a `.module.css`.
- `src/ui/theme.ts` is also imported by server code (the link-preview image), so keep it to plain objects: no `Component.extend(...)`.

## Conventions

- Specs go in `docs/specs/`, plans in `docs/plans/`.
- Verify with `npm run lint`, `npm run typecheck` and `npm test` (`npm run test:int` for server and database changes).
