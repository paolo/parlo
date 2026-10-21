# Language Profile Implementation Plan

> **For agentic workers:** Execute with superpowers:executing-plans (native, inline; the user chose this mode for
> Parlo, see the living plan). Steps use checkbox (`- [ ]`) syntax. Tick them as you go.

**Goal:** Every user picks three languages (native first, each with an optional region); Parlo translates between
exactly those three, explains in the native one, and shows region flags.

**Architecture:** A framework-free language catalog in `src/shared` feeds the DB enum, API validation, prompt and UI.
The existing `language_level` table becomes the profile (`region`, `position` columns). The translator takes the
user's three languages instead of a fixed `es|en|fr` trio; phrase groups hold a list of phrases. The app gates on a
complete profile with an inline picker.

**Tech Stack:** Next.js 16, TypeScript, Drizzle + Postgres, Zod, Mantine, TanStack Query, Vitest + RTL, Biome.

**Spec:** [`docs/specs/2026-10-20-language-profile-design.md`](../specs/2026-10-20-language-profile-design.md)
(extends [`2026-10-09-parlo-design.md`](../specs/2026-10-09-parlo-design.md); read both).

**Branching:** one branch, `language-profile` (already holds the spec commit), with atomic commits per step group and
a single `git merge --no-ff` at the end ("Merge language profile"). Deviation from "branch per task" on purpose: the
tasks only work together (the translate route needs the picker), and every merge to `main` deploys, so merging
tasks separately would break production midway.

## Global Constraints

- Languages exactly: `es en fr uk pt zh pa tl ar hi ru it fa`. Profile size exactly 3 (`PROFILE_SIZE`), position
  0 = native. Native level `native`; learning levels `intermediate`.
- Region = ISO 3166-1 alpha-2 uppercase, must belong to the language's region list; missing region → the
  language's `defaultRegion` (first entry). English default `GB`, French default `FR`.
- Flag is never the only identifier: always render flag plus language name.
- System prompt stays static (no per-user data); user data goes in the user message.
- Explanation language is always the native language.
- `src/server/**` never imports from `next/*`. `src/shared/**` imports nothing from `src/server` or `src/ui`.
- Commits: one title line, imperative, capitalized, no prefix, no body, no trailers (`~/.claude/CLAUDE.md`).
- No real model calls in tests. Read `node_modules/next/dist/docs/` before touching Next.js APIs (`AGENTS.md`).
- Verify each task with `npm run lint`, `npm run typecheck`, `npm test`, and `npm run test:int` when it touches the
  DB (needs `npm run db:up`).

## Review Focus

1. A legacy user (no profile rows) with old es/en/fr groups: history and phrasebook still render every phrase of
   those groups (Task 5), and translate answers `409 profile_incomplete` (Task 7).
2. Phrase in a supported language the user did not pick (e.g. Italian for an es/en/fr user): 422
   `unsupported_language`, response names the user's languages, no usage recorded (Task 7).
3. Model returns translations that miss, duplicate or add a language: 502, nothing stored (Task 6).
4. Profile PUT with duplicate languages, 2 or 4 entries, or a region from another language (`pt` + `BO`): 400,
   previous profile untouched (Task 4); a failed replace never leaves a partial set (Task 3).
5. Arabic or Persian phrase text renders right-to-left inside its card without breaking layout (Task 5).

---

### Task 1: Language catalog

**Files:**
- Create: `src/shared/languages.ts`, `src/shared/languages.test.ts`
- Modify: `src/server/db/schema.ts:14-15` (derive `LANGS` from the catalog)

**Interfaces:**
- Produces, all exported from `src/shared/languages.ts`:
  - `LANG_CODES: readonly [...]` (the 13 codes above, in that order) and `type Lang`
  - `PROFILE_SIZE = 3`
  - `interface LanguageInfo { code: Lang; endonym: string; name: string; defaultRegion: string; regions: readonly string[] }`
    (`name` is the English name used in prompts)
  - `LANGUAGES: Record<Lang, LanguageInfo>` with the region lists from spec §4 (first entry = default)
  - `regionFlag(region: string): string` (regional-indicator emoji); `languageFlag(lang: Lang, region: string | null): string`
    (falls back to the language's default region)
  - `regionName(region: string): string` via `Intl.DisplayNames(["en"], { type: "region" })`
  - `isRegionOf(lang: Lang, region: string): boolean`
- `schema.ts` keeps exporting `LANGS` (= `LANG_CODES`) and `Lang` (re-exported), so existing imports keep working.

- [ ] **Step 1: Write failing tests** in `languages.test.ts`:
  `every language's defaultRegion is the first of its regions`; `regionFlag("BO")` equals `"🇧🇴"`;
  `languageFlag("es", null)` equals `regionFlag("ES")`; `languageFlag("pt", "BR")` equals `"🇧🇷"`;
  `regionName("BO")` equals `"Bolivia"`; `isRegionOf("pt", "BO")` is false and `isRegionOf("es", "BO")` is true;
  `LANG_CODES` has 13 unique entries and `LANGUAGES` has a key for each; `en` default `GB`, `fr` default `FR`.
- [ ] **Step 2:** Run `npx vitest run --project unit src/shared` — expect FAIL (module missing).
- [ ] **Step 3:** Implement the module; endonyms: Español, English, Français, Українська, Português, 中文,
  ਪੰਜਾਬੀ, Tagalog, العربية, हिन्दी, Русский, Italiano, فارسی. Then point `schema.ts` at it.
- [ ] **Step 4:** Run the unit project and `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Add language catalog with regions and flags".

### Task 2: Profile columns and extended language enum

**Files:**
- Modify: `src/server/db/schema.ts` (`languageLevel`), `src/server/db/schema.int.test.ts`
- Create: `src/server/db/migrations/0001_*.sql` (+ meta), generated

**Interfaces:**
- Consumes: `LANG_CODES` (Task 1).
- Produces: `languageLevel` gains `region: text("region")` (nullable), `position: smallint("position").notNull()`,
  unique index `language_level_user_position_idx` on `(userId, position)`, check
  `language_level_position_range` (`position between 0 and 2`). `lang` enum now has all 13 codes.

- [ ] **Step 1: Write failing int tests** in `schema.int.test.ts` (follow its existing style): a `phrase` row with
  `lang: "pt"` inserts; two `languageLevel` rows for one user with the same `position` are rejected; `position: 3`
  is rejected; `region` round-trips (`"BO"`).
- [ ] **Step 2:** `npm run db:up && npm run test:int -- schema` — expect FAIL.
- [ ] **Step 3:** Edit the schema, run `npm run db:generate`, review the SQL (it must contain `ALTER TYPE "lang" ADD
  VALUE` for the 10 new codes). `language_level` has never been written to, so `NOT NULL` without a default is safe.
- [ ] **Step 4:** `npm run db:migrate` (dev) then `npm run test:int` — expect PASS.
- [ ] **Step 5:** Commit "Extend languages and add region and position to language profile".

### Task 3: Profile domain and repository

**Files:**
- Create: `src/server/profile/types.ts`, `src/server/profile/service.ts`, `src/server/profile/service.test.ts`,
  `src/server/profile/repository.ts`, `src/server/profile/repository.int.test.ts`
- Modify: `src/server/container.ts` (add `getProfileRepository()`)

**Interfaces:**
- Produces:
  - `interface ProfileLanguage { lang: Lang; region: string; level: Level; position: number }` (`types.ts`)
  - `interface ProfileInput { lang: Lang; region?: string }`
  - `interface ProfileRepository { getProfile(userId: string): Promise<ProfileLanguage[]>; replaceProfile(userId: string, languages: ProfileLanguage[]): Promise<void> }`
  - `buildProfile(input: ProfileInput[]): ProfileLanguage[]` and `isProfileComplete(profile: ProfileLanguage[]): boolean` (`service.ts`)
  - `class DrizzleProfileRepository implements ProfileRepository` (`new DrizzleProfileRepository(db: Db)`)
  - `getProfileRepository(): ProfileRepository` in the container

- [ ] **Step 1: Write failing tests.** Service: `buildProfile` puts position 0 first with level `native` and the
  others `intermediate`; missing region becomes the language default (`en` → `GB`, `fr` → `FR`); an explicit
  `es` + `BO` is kept; `isProfileComplete` is true only for exactly 3 entries. Repository (int): `getProfile` for a
  user with no rows is `[]`; replace then get round-trips ordered by position; a second replace swaps the set
  entirely; **replacing with an invalid set (duplicate position) throws and leaves the old profile intact**
  (Review Focus 4); `getProfile` fills the default region when the stored one is null.
- [ ] **Step 2:** Run unit + `npm run test:int -- profile` — expect FAIL.
- [ ] **Step 3:** Implement. `replaceProfile` deletes then inserts inside one `db.transaction`. `getProfile` orders by
  `position`.
- [ ] **Step 4:** Run both test projects — expect PASS.
- [ ] **Step 5:** Commit "Add profile service and repository".

### Task 4: Profile API

**Files:**
- Create: `src/server/profile/schema.ts`, `src/app/api/profile/route.ts`, `src/app/api/profile/route.test.ts`

**Interfaces:**
- Consumes: `buildProfile`, `getProfileRepository`, `withSession`, `parseJson`, `LANGUAGES`, `isRegionOf`.
- Produces:
  - `profileBodySchema` (zod): `{ languages: { lang: Lang; region?: string }[] }`, length exactly `PROFILE_SIZE`,
    distinct `lang`, `region` (when given) passes `isRegionOf`; failures → 400 `invalid_input` via `parseJson`
  - `GET /api/profile` → `200 { languages: ProfileLanguage[] }` (`[]` when none)
  - `PUT /api/profile` → `200 { languages: ProfileLanguage[] }` after `replaceProfile`

- [ ] **Step 1: Write failing route tests** (mock `@/server/container` as in
  `src/app/api/phrase-groups/route.test.ts`): 401 without session; GET empty profile → `{ languages: [] }`; PUT valid
  `[{es,BO},{en},{fr}]` → 200 with en region `GB`, fr region `FR`, es level `native`, and the repo was called once;
  400 for 2 entries, 4 entries, duplicate `en`, unknown lang `xx`, `{ lang: "pt", region: "BO" }`; the repo is not
  called on any 400.
- [ ] **Step 2:** Run `npx vitest run --project unit src/app/api/profile` — expect FAIL.
- [ ] **Step 3:** Implement the schema and the two handlers.
- [ ] **Step 4:** Run tests — expect PASS.
- [ ] **Step 5:** Commit "Add profile endpoints".

### Task 5: Phrase groups as ordered lists

**Files:**
- Modify: `src/server/phrases/types.ts` (`PhraseGroupDTO.phrases: PhraseDTO[]`), `src/server/phrases/repository.ts`
  (`toDTO`), `src/test/fixtures.ts`, `src/ui/translate/TranslationResult.tsx`, `src/ui/PhraseCard.tsx`,
  `src/ui/phrasebook/PhrasebookView.tsx` and any other consumer of `phrases[...]` (grep `phrases`), their tests,
  `src/server/phrases/repository.int.test.ts`, `src/app/api/**` tests asserting `phrases`
- Create: `src/ui/phrases.ts` + `src/ui/phrases.test.ts`
- Delete later in Task 8: `src/ui/langs.ts` (keep until then; this task stops using `LANG_ORDER`)

**Interfaces:**
- Produces:
  - `PhraseGroupDTO.phrases: PhraseDTO[]`; `toDTO` returns the root first, the rest ordered by `LANG_CODES` index
  - `orderPhrases(phrases: PhraseDTO[], profileLangs: Lang[]): PhraseDTO[]` in `src/ui/phrases.ts`: phrases whose
    lang is in `profileLangs` first (in profile order), then the others in their given order; root is **not**
    special-cased here
  - `makeGroup()` fixture keeps its three es/en/fr phrases as an array

- [ ] **Step 1: Write failing tests.** `orderPhrases`: profile `[pt, en, fr]` over phrases `[es, en, fr]` returns
  `[en, fr, es]`; unknown profile → input order. Repository int: `insertGroup` DTO has `phrases` as an array with the
  root first. UI: `TranslationResult` with a group of `pt/en/fr` phrases renders three cards and the detected badge
  shows the root language; a **legacy group (es/en/fr) rendered for a pt/en/fr user still shows all three cards**
  (Review Focus 1); `PhraseCard` for an Arabic phrase renders its text inside an element with `dir="auto"`
  (Review Focus 5).
- [ ] **Step 2:** Run unit + ui projects and `npm run test:int -- phrases` — expect FAIL.
- [ ] **Step 3:** Change the DTO and `toDTO`; update consumers to map over the array (grid columns: 1 on base,
  `min(phrases.length, 3)` on `sm`); add `dir="auto"` to the phrase text; replace `LANG_LABELS/LANG_FLAGS` use in
  `TranslationResult`/`PhraseCard` with temporary lookups from the catalog (`LANGUAGES[lang].endonym`,
  `languageFlag(lang, null)`) — Task 8 swaps them for `LangLabel`.
- [ ] **Step 4:** Run `npm test`, `npm run test:int`, `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Render phrase groups as lists of any languages".

### Task 6: Profile-aware translator

**Files:**
- Modify: `src/server/translation/types.ts`, `schema.ts`, `prompt.ts`, `fake.ts`, `haiku.ts` (only if types need),
  `src/server/phrases/service.ts`, and their tests (`prompt.test.ts`, `schema.test.ts`, `haiku.test.ts`,
  `service.test.ts`), `scripts/smoke-haiku.mts`
- Delete: `src/server/profile/defaults.ts` happens in Task 7

**Interfaces:**
- Consumes: `ProfileLanguage`, `LANGUAGES`.
- Produces:
  - `TranslateInput { text: string; languages: ProfileLanguage[] }` (native first)
  - `TranslationResult { detectedLang: Lang | "other"; correction: {text; explanation} | null; translations: { lang: Lang; text: string }[]; notes: string | null }`
  - `translationOutputSchema` with `detectedLang: z.enum([...LANG_CODES, "other"])` and `translations: z.array(z.object({ lang: z.enum(LANG_CODES), text: z.string() }))`
  - `buildUserMessage(input: TranslateInput): string` (lists the three languages with region and level, the native
    language as the explanation language, and the regional hint from spec §5.3)
  - `SYSTEM_PROMPT`: static, generic ("the three languages listed in the user's message"), no language names baked in
  - `buildNewGroup(userId: string, text: string, result: TranslationResult, languages: ProfileLanguage[]): NewPhraseGroup`
    — throws `TranslationFailedError` unless `result.translations` covers exactly the profile's languages once each;
    root text = the user's original text; one phrase per profile language; throws a plain `Error` for `"other"` as today
  - Remove `explanationLanguage` and the `Levels` type

- [ ] **Step 1: Write failing tests.** Prompt: user message for `[es/BO native, en/GB, fr/FR]` contains
  `Spanish (Bolivia)`, `English (United Kingdom)`, `French (France)`, a line naming Spanish as the explanation
  language, and the "do not limit your output to them" hint; `SYSTEM_PROMPT` contains none of `Bolivia`, `Spanish`,
  `French`; the `<phrase>` tag stripping test is kept. Schema: a result with a `translations` list parses; an unknown
  lang is rejected. Service: root keeps original text; one phrase per profile language; **missing language, duplicate
  language and extra language each throw `TranslationFailedError`** (Review Focus 3); `detectedLang` outside the
  profile is not this function's job (route, Task 7).
- [ ] **Step 2:** Run `npx vitest run --project unit src/server` — expect FAIL.
- [ ] **Step 3:** Implement. Keep the existing correction rules text; only the language framing changes. Update the
  smoke script to pass a sample three-language profile.
- [ ] **Step 4:** Run unit tests and `npm run typecheck` (the route breaks until Task 7; type-check only after Task 7
  if needed, and say so in the commit order: do Task 7 immediately after).
- [ ] **Step 5:** Commit "Translate between the user's three languages".

### Task 7: Translate route requires a profile

**Files:**
- Modify: `src/app/api/translations/route.ts`, `route.test.ts`, `route.int.test.ts`
- Delete: `src/server/profile/defaults.ts`

**Interfaces:**
- Consumes: `getProfileRepository`, `isProfileComplete`, `buildNewGroup(..., languages)`, `LANGUAGES`.
- Produces: `409 { error: "profile_incomplete" }` when the profile is not complete (checked **before** the limiter,
  translator and usage); `422 { error: "unsupported_language", languages: Lang[] }` when `detectedLang` is `"other"`
  or not in the profile (no usage); the translator receives `languages` from the stored profile; a
  `TranslationFailedError` from `buildNewGroup` also returns 502 with no usage.

- [ ] **Step 1: Write failing tests** (fakes): incomplete profile → 409, translator not called, limiter not called;
  complete profile → the `FakeTranslator` records `languages` equal to the stored profile; detected `it` for an
  `es/en/fr` profile → 422 with `languages: ["es","en","fr"]` and `record` not called (Review Focus 2); `"other"` →
  422; coverage mismatch → 502 and `insertGroup` not called; happy path 201 with a `pt/en/fr` profile creates three
  phrases in those languages.
- [ ] **Step 2:** Run `npx vitest run --project unit src/app/api/translations` — expect FAIL.
- [ ] **Step 3:** Implement; wrap `translate` and `buildNewGroup` in the same `TranslationFailedError` handler.
  Remove `defaults.ts` and its imports.
- [ ] **Step 4:** Run `npm test`, `npm run test:int`, `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Require a language profile to translate".

### Task 8: Profile client helpers and language labels

**Files:**
- Create: `src/ui/LangLabel.tsx` + `.test.tsx`
- Modify: `src/ui/queries.ts`, `src/ui/errors.ts` + `errors.test.ts`, `src/ui/PhraseCard.tsx`,
  `src/ui/translate/TranslationResult.tsx`, `src/ui/translate/TranslateForm.tsx` (+ test), `src/app/(app)/page.tsx`
- Delete: `src/ui/langs.ts`

**Interfaces:**
- Produces:
  - `LangLabel({ lang, region }: { lang: Lang; region?: string | null })` renders `flag endonym`; with a region
    other than the default, adds the region name in dimmed text (`Español · Bolivia`)
  - `queryKeys.profile = ["profile"] as const`; `useProfile()` → `UseQueryResult<{ languages: ProfileLanguage[] }>`
    (GET `/api/profile`); `useSaveProfile()` mutation taking `{ lang: Lang; region?: string }[]`, PUT, invalidates
    `queryKeys.profile`
  - `errorMessage` handles `profile_incomplete` ("Pick your three languages first.") and `unsupported_language`
    using `body.languages` ("Parlo understands <endonyms joined by ", ">. Try a phrase in one of those.")

- [ ] **Step 1: Write failing tests.** `LangLabel lang="es" region="BO"` shows `🇧🇴`, `Español` and `Bolivia`;
  `LangLabel lang="en"` shows `🇬🇧` and `English` without a region name; `errorMessage` for
  `unsupported_language` with `languages: ["es","en","fr"]` mentions `Español, English, Français`; placeholder in
  `TranslateForm` is "Type a phrase in any of your languages…"; translate page subtitle no longer names Spanish,
  English, French.
- [ ] **Step 2:** Run `npm test` — expect FAIL.
- [ ] **Step 3:** Implement; switch `PhraseCard` and `TranslationResult` to `LangLabel` (pass the phrase's lang, no
  region); remove `langs.ts`.
- [ ] **Step 4:** Run `npm test` and `npm run typecheck` — expect PASS.
- [ ] **Step 5:** Commit "Add language labels and profile queries".

### Task 9: Language picker and onboarding gate

**Files:**
- Create: `src/ui/profile/LanguagePicker.tsx` + `.test.tsx`, `src/ui/profile/ProfileGate.tsx` + `.test.tsx`
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `LANGUAGES`, `LANG_CODES`, `regionName`, `LangLabel`, `useProfile`, `useSaveProfile`.
- Produces:
  - `LanguagePicker({ initial, onSaved }: { initial?: ProfileLanguage[]; onSaved?: () => void })`: three slots
    (Native language, Second language, Third language), each a language `Select` (options show flag + endonym)
    plus, **for the native slot only**, a region `Select` preselected with the language's default and reset when the
    language changes; choosing a language removes it from the other slots' options; Save is disabled until all three
    are chosen; submits `[{lang, region?}]` through `useSaveProfile`. When `initial` is given (profile page, Task 10)
    every slot shows its region select.
  - `ProfileGate({ children })`: while `useProfile` loads shows a centered `Loader`; incomplete (not 3 languages)
    renders `LanguagePicker` with a welcome heading instead of `children`; complete renders `children`.
  - `(app)/layout.tsx` wraps: `<AppLayout><ProfileGate>{children}</ProfileGate></AppLayout>`

- [ ] **Step 1: Write failing tests** (mock `fetch` or the `queries` module like `UsageBadge.test.tsx`):
  picker preselects `Spain` region after choosing Español, then changing to Bolivia and saving sends
  `{ languages: [{lang:"es",region:"BO"},{lang:"en"},{lang:"fr"}] }`; Save disabled with two languages; a language
  chosen in slot 1 is absent from slot 2's options; gate shows the picker for `{ languages: [] }` and the children for
  three languages; gate shows the loader while pending.
- [ ] **Step 2:** Run `npm test` — expect FAIL.
- [ ] **Step 3:** Implement with Mantine `Select`/`Stack`/`Button`; the two learning slots send no region (server
  defaults apply).
- [ ] **Step 4:** Run `npm test`, `npm run typecheck`, `npm run lint` — expect PASS.
- [ ] **Step 5:** Commit "Add language picker and onboarding gate".

### Task 10: Profile page, docs and manual check

**Files:**
- Modify: `src/app/(app)/profile/page.tsx` (+ create `src/ui/profile/ProfileView.tsx` and test),
  `docs/plans/2026-10-09-parlo-plan.md`, `docs/specs/2026-10-09-parlo-design.md` (§4/§5 note pointing here),
  `README.md` if it lists the three languages

**Interfaces:**
- Consumes: `LanguagePicker` with `initial` (all regions editable), `useProfile`, `useUsage`.
- Produces: `ProfileView` renders the picker prefilled from the stored profile (title "Your languages") and a short
  reminder that explanations come in the first language; saving shows a success notification.

- [ ] **Step 1: Write failing test:** `ProfileView` with a stored `pt-BR / en-GB / fr-FR` profile shows three
  region selects with `Brazil`, `United Kingdom`, `France`; changing en to `Canada` and saving sends `region: "CA"`.
- [ ] **Step 2:** Run `npm test` — expect FAIL.
- [ ] **Step 3:** Implement; replace the `ComingNext` placeholder (levels stay out of scope; leave a short "Levels
  coming next" note).
- [ ] **Step 4:** Update the living plan: add row `1.11 Language profile · language-profile · Opus 5.5 / Sonnet 5.5`
  to the Progress table with a link to this plan, change 1.9 to say "builds on the `language_level` table from 1.11;
  `Levels` is now a list of `ProfileLanguage`", and fix the Global Constraints line about "Languages exactly es|en|fr".
  Add a one-line note at the top of spec §4 and §5 pointing at the new spec.
- [ ] **Step 5:** Run `npm run lint && npm run typecheck && npm test && npm run test:int && npm run build` — all pass.
- [ ] **Step 6: Manual check** with `npm run dev` and a real key: sign in as a fresh user; picker appears; choose
  Português (Brasil) + English + Français; translate "tô com saudade" in pt, an English phrase and a French phrase;
  confirm three cards in those languages, flags/names right, explanations in Portuguese; then submit an Italian
  phrase and confirm the 422 message names the three languages; open Profile, switch English to Canada, save.
- [ ] **Step 7:** Commit "Add profile page and record language profile in plan", then
  `git checkout main && git merge --no-ff language-profile -m "Merge language profile"` **only after the user
  approves the branch review.**
