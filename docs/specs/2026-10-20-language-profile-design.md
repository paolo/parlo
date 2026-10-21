# Parlo — Language Profile Design

Extends [`2026-10-09-parlo-design.md`](2026-10-09-parlo-design.md). Where they disagree, this document wins for
languages, levels and the translate flow.

## 1. Intent

Parlo is hard-wired to Spanish, English and French. Its users are immigrants in Canada, often learning French
as leverage while already knowing English, and their native languages vary (Spanish, Portuguese, Ukrainian,
Arabic, Mandarin, Punjabi and so on). Each user picks **three languages**; Parlo translates between exactly
those three, explains and corrects in the user's **native** language, and knows which regional variety the
user speaks (Bolivian Spanish, Brazilian Portuguese) so it can understand regional phrases and feel personal.

Success: a new user signs in, picks their native language (and region) plus two more, and the first
translation already works between their three languages, with explanations in their native one.

### Goals

- Support 13 languages at launch: Spanish, English, French, Ukrainian, Portuguese, Mandarin, Punjabi,
  Tagalog, Arabic, Hindi, Russian, Italian, Persian. (Cantonese, Urdu and Tamil are a later round.)
- Every user has exactly 3 languages. The limit is one constant, so raising it later is a one-line change
  plus prompt and UI checks.
- Optional region per language, shown as a flag and fed into the prompt as a soft hint.
- Onboarding gate: a user without a complete profile sees the picker instead of the app.
- Editable later in the profile page.

### Non-goals

- Cantonese, Urdu, Tamil and other languages beyond the 13 above.
- More than 3 languages per user.
- A per-language level editor (plan task 1.9). This work stores levels but only sets them by default (§3).
- Translating the Parlo UI itself. The interface stays in English.
- Right-to-left layout polish and romanization for non-Latin scripts beyond what works out of the box
  (see §7).

### Anti-goals

- The flag must never be the only identifier of a choice. English and French can both be shown with the
  Canadian flag; the language name always sits next to it.
- Regional hints must not narrow output to that region ("understand Bolivian phrases", not "only use
  Bolivian phrases").
- First login must not become a long form: one native-language step with region, then two more languages.

## 2. Decisions already made with the user

- A choice is `(lang, region?)`, for example `es` + Bolivia or `pt` + Brazil.
- Position 1 is the **native** language. It asks for a region (preselected with the language's default,
  editable). Its explanations and corrections are written in this language.
- Positions 2 and 3 are learning languages. Their region is **not asked on first login** and silently
  defaults to: English → United Kingdom (`GB`), French → France (`FR`). Other languages default to their
  canonical country (§4). The user can change any region later in the profile.
- The prompt receives each language's region as a soft hint.
- Flags come from the region's country code and fall back to the language's default country.

## 3. Data model

The existing `language_level` table becomes the user's language profile (one row per chosen language).

```
language_level   (renamed in code as the profile table; keep the table name to avoid a data-copy migration)
  user_id   text fk -> user.id (cascade)
  lang      enum  -- extended with the new codes, see below
  level     enum('native','advanced','intermediate','beginner')   -- unchanged
  region    text null     -- ISO 3166-1 alpha-2, uppercase; validated against the region list for the lang
  position  smallint not null  -- 0 = native, 1 and 2 = learning
  pk (user_id, lang)
  unique (user_id, position)
  check position between 0 and 2
```

- `lang` enum gains: `uk`, `pt`, `zh`, `pa`, `tl`, `ar`, `hi`, `ru`, `it`, `fa` (existing: `es`, `en`, `fr`).
  Added with `ALTER TYPE ... ADD VALUE`. `phrase.lang` uses the same enum, so history can hold any of them.
- Levels: native language is stored as `native`; learning languages default to `intermediate`. Nothing in
  this work lets the user edit levels; task 1.9 later adds that on top of this table.
- Rows are written all at once (replace the user's set in one transaction), never partially.
- **Existing users** have no rows. They are treated as "profile incomplete" and see the picker on next
  login. Their old phrase groups keep the three phrases they already have.

## 4. Language catalog

A single shared module (framework-free, importable from both `src/server` and `src/ui`) defines, per
language: code, endonym (label shown in the UI, e.g. "Español", "Українська"), English name (used in the
prompt), `defaultRegion`, and a curated `regions` list. The UI and the server validation both read from it.

Starting regions (builder may extend the lists; the first entry is the default):

| Lang | Regions |
|---|---|
| es | ES, MX, CO, AR, PE, VE, CL, EC, BO, UY, PY, CR, PA, DO, CU, GT, HN, SV, NI, PR |
| en | GB, CA, US, AU, IE, NG, IN, PH, ZA, JM |
| fr | FR, CA, BE, CH, CI, SN, CD, HT, MA, DZ |
| pt | PT, BR, AO, MZ |
| uk | UA |
| zh | CN, TW, SG |
| pa | IN, PK |
| tl | PH |
| ar | SA, EG, MA, DZ, LB, IQ, SY, SD, JO |
| hi | IN |
| ru | RU, UA, KZ, BY |
| it | IT, CH |
| fa | IR, AF |

Flag = emoji built from the region code (regional indicator symbols), so no image assets or per-country
table are needed. Known limitation: Windows desktop browsers render flag emoji as two letters. Accepted for
now because the language name is always shown beside the flag (see anti-goals); revisit if it matters.

## 5. Translate flow changes

1. `POST /api/translations { text }`: load the user's profile. No complete profile (3 rows) → `409
   profile_incomplete`, no usage recorded, translator not called.
2. The translator input becomes `{ text, languages: [{ lang, region, level }] x3 (native first) }`.
3. **Prompt.** The system prompt stays static and cacheable but is made generic: "translate between the
   three languages listed in the user's message". The user message lists the three languages with region
   and level, tells the model the explanation language (the native one), and adds the regional hint, for
   example: "Native: Spanish (Bolivia). Understand regional vocabulary and phrasing from these regions, but
   do not limit your output to them." Output varieties follow the regions where natural (UK spelling for
   English by default).
4. **Structured output.** `translations` becomes a list `{ lang, text }[]` instead of a fixed `{es,en,fr}`
   object, so the schema stays static. The server checks that the list covers exactly the user's three
   languages; otherwise it is a `TranslationFailedError` (502).
5. `detectedLang` must be one of the user's three languages. A phrase in any other language (including a
   supported language the user didn't pick) returns 422 `unsupported_language`, with a message that names
   the user's languages. No usage is recorded.
6. `buildNewGroup` creates one phrase per language the user has (3), root = detected language.
7. Explanation language = the user's native language (replaces `explanationLanguage(levels)`, which picked
   the strongest-level language). The existing correction rules in the prompt are unchanged.

## 6. API and UI

**API**
- `GET /api/profile` → `{ languages: [{ lang, region, level, position }] }` (empty array when incomplete).
- `PUT /api/profile { languages: [{ lang, region? }] x3 }`. Zod: exactly 3 entries, distinct `lang`, `lang`
  in the catalog, `region` (if given) in that language's region list, missing region → the language's
  default. First entry is the native language. Replaces the user's rows and returns the saved profile.

**UI**
- `PhraseGroupDTO.phrases` changes from `Record<Lang, PhraseDTO>` to an ordered `PhraseDTO[]`, because a
  group no longer has a fixed set of languages. `TranslationResult`, `PhraseCard`, history and phrasebook
  render the phrases the group has, root first, then in the viewer's profile order where they match.
- `src/ui/langs.ts` is replaced by the shared catalog plus a small `LangLabel` component (flag + name).
- Onboarding: the app layout fetches the profile; when incomplete it renders `LanguagePicker` in place of
  the page. The picker has three steps (native language + region, learning language 1, learning
  language 2); each language can be chosen once. Saving invalidates the profile query and the app
  appears.
- Profile page: the same picker content as an editable form (language and region per slot), reusing the
  PUT endpoint. The existing placeholder text about levels is reworded; levels stay out of scope.
- `TranslateForm` placeholder reads "Type a phrase in any of your languages…".

## 7. Constraints and risks

- Non-Latin scripts (Arabic, Persian, Mandarin, Punjabi, Hindi, Russian, Ukrainian): UI text must render
  correctly in Mantine's default fonts. Arabic and Persian phrases should render right-to-left inside their
  cards (`dir="auto"` on phrase text is enough; no page-level RTL). Punjabi uses Gurmukhi (India) as the
  default script; Shahmukhi (Pakistan) is not supported in this round. Mandarin is Simplified for CN/SG and
  Traditional for TW. Romanization/pinyin is not added in this work.
- Changing the profile does not alter old history: old groups keep whatever phrases they have.
- Haiku 5.5 translation quality varies by language pair; the manual check in §8 is the only quality gate.
- Leave `src/server/**` free of `next/*` imports (project rule).

## 8. Testing

- Catalog: every language has a default region contained in its regions; flag builder maps `BO` → 🇧🇴.
- Profile repository (int): replace-set round-trips, enforces 3 rows and unique positions, rejects an
  unknown region; empty for a user with no rows.
- Profile route: 400 for 2 or 4 entries, duplicate languages, region outside the language, unknown lang;
  missing region falls back to the default; 401 without a session.
- Prompt: user message contains the three languages, regions and the native explanation language; the
  system prompt contains no per-user data.
- Schema/service: translations must cover exactly the user's 3 languages; `detectedLang` outside them → 422;
  root keeps the user's original text; one phrase per user language.
- Translate route (fakes): 409 `profile_incomplete` without calling translator or recording usage.
- UI: `LanguagePicker` completes in three steps, blocks duplicates, preselects default regions; the app
  layout shows the picker for an incomplete profile and the app otherwise; phrase cards render any
  language list.
- Manual (no model calls in CI): with a pt-BR native profile plus English and French, check one phrase in
  each direction and a regional phrase, confirm explanations arrive in Portuguese.

## 9. Left to the builder (calls already made, flagged for the user to check)

- Keep the `language_level` table name and add `region` and `position` columns (no data copy).
- Flags as emoji (Windows limitation accepted).
- Region lists in §4 and the "default region preselected" behaviour on the native step.
- `translations` as a list in the structured output.
- Explanation language is always the native language.
- Levels are stored but not editable here; plan task 1.9 is rebased on this table afterward.
- The plan gets a new task for this work, and 1.9 is reworded to depend on it.
