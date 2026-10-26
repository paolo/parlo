# Parlo — Practice Starter Deck, Favorites Naming and Compact Language Strip Design

Extends [`2026-10-21-history-and-review-design.md`](2026-10-21-history-and-review-design.md) (Review mode) and
[`2026-10-25-redesign-design.md`](2026-10-25-redesign-design.md) (look and feel). Where they disagree, this
document wins for the Practice page, the language strip and the word "Favorites".

## 1. Intent

Parlo is about to go to friends and family. Two things get in the way of a good first minute:

1. **Practice is empty for a new user.** Practice only deals cards from favorited phrases, and a new user has
   none; their first translations are also quick tests they won't favorite. The main goal: **a user can
   practice right away**, on the first visit.
2. **Small polish found on a real phone.** On an iPhone 13 Pro (390px wide, default text size) the three
   language pills on Translate don't fit on one row, and "Starred" is a less friendly word than "Favorites".

### Goals

- Practice offers three sources: **Favorites**, **Recent** (the user's translation history) and **Starter**
  (a built-in set of about 100 everyday phrases, pre-translated into all 13 languages).
- The user picks how many cards (5, 10 or 20); the cards are drawn at random from the chosen source.
- Setup is quick and the card stays the star: setup collapses once practice starts.
- Starter is the first of several **bundles**; the data shape makes adding Halloween, Christmas and so on a
  data-only change.
- The language strip on Translate is compact and never wraps or pushes the page sideways.
- The user-facing word is "Favorites" everywhere ("Starred", "star" and "starred" go away from copy).

### Non-goals

- Spaced repetition or remembering which cards were hard across sessions.
- User-created bundles, a bundle store or per-user bundle unlocking. Bundles ship with the app.
- Starring or editing bundle phrases, or copying them into the user's phrasebook.
- Renaming the database column, API parameter or type fields (`isFavorite` already says Favorite).
- Changing the star icon.

### Anti-goals

- Practice must not call the model or touch the daily quota (unchanged from Review mode v1).
- Setup must not push the card far down the screen on a phone.
- A bundle card must never show a machine-garbled translation the author hasn't had the chance to skim: the
  phrase data is reviewed before release.
- No empty dead end: choosing a source with no cards offers a way forward in place.

## 2. Decisions made with the user

- Pre-translate the Starter set into **all 13 languages**, so it works for any profile. The author skims
  the translations before release.
- Mix: roughly **80% Canadian English and 20% Québécois French** as the source phrases, about 100 phrases.
- Tag the set so more bundles can follow (Halloween, Christmas…). The set is named **Starter**.
- Pills on Translate become non-actionable (the link to the profile goes away) and compact; the row scrolls
  horizontally on its own if a long language name still doesn't fit; no visible scrollbar.
- "Favorites" replaces "Starred".
- The author is open to ideas; the main goal is practicing right away.

## 3. Design

### 3.1 Practice flow

The Practice page has two states.

**Setup** (before cards): one compact panel under the title.

- **Source:** a three-option segmented control: **Favorites · Recent · Starter**, each showing its available
  count where cheap ("Favorites 3"). Starter shows no count.
- **Cards:** a segmented control **5 · 10 · 20**.
- Existing controls stay: Flip/Type, "Practice in" language menu, and the "Type in" language with swap.
- One primary pill, **Start**.

**Practicing** (after Start): the setup panel collapses to a single summary line ("Starter · 10 cards ·
Change"). **Change** reopens setup (and ends the current session; it is a restart, like changing language
does today). The card deck sits directly under that line, so the card is as high on screen as it is today.

Defaults:

- First visit: Starter, 10 cards.
- Later visits: the last choice. If the remembered source is Favorites but the user has none, fall back to
  Starter.
- Choices are remembered in `localStorage` (wrapped in try/catch; the page works without it).

Drawing cards: filter the source to groups with a phrase in the practice language (and the answer language
when typing, as today), shuffle, take the first N. If fewer than N exist, use all of them. The existing
"skipped: no X version" line stays for Favorites and Recent. Starter never skips, since it covers all 13
languages. **Practice again** on the Done screen deals a fresh random draw from the same source. The Done
screen's second action ("Back to phrasebook") stays.

Source specifics:

- **Favorites:** `useAllFavorites` as today (cap 100).
- **Recent:** the user's most recent 100 history groups, fetched with the same shape of request as
  `useAllFavorites` (`favorite=false&limit=100`). Includes favorites. (Author's "All" renamed "Recent"
  because history keeps only the latest 500 and Practice only reads the latest 100: my call.)
- **Starter:** bundled data, no request.

Empty source: Favorites with none, or Recent with none, shows the empty state in place of the deck, with
copy that says what to do and a **Use Starter** action alongside "Go to Translate". My call: only these two
sources can be empty.

Navigation placement and page copy: the Practice page subtitle changes from "Cards from the phrases you've
starred…" to short, warm copy that doesn't presume favorites ("Read a phrase, try to recall the rest, then
reveal."). Exact wording is the builder's, following the CLAUDE.md copy rules.

### 3.2 Bundles and the Starter set

Bundles are static data in the repo, shared by server and UI (`src/shared/`, no imports from `src/server` or
`src/ui`).

```ts
interface Bundle {
  id: string;            // "starter"; later "halloween", "christmas"
  name: string;          // "Starter"
  phrases: BundlePhrase[];
}
interface BundlePhrase {
  id: string;            // stable, e.g. "starter-014"; never reused or renumbered
  topic: string;         // e.g. "greetings", "transit"; for the author's review and future filtering
  source: "en" | "fr";   // the language it was written in; the other 12 are translations
  text: Record<Lang, string>; // all 13 languages, enforced by the type
}
```

A bundle phrase is turned into the same `PhraseGroupDTO` shape the Review session already consumes
(`id: "bundle:starter-014"`, phrases in catalog order), so `buildCards`, `ReviewSession` and the deck need no
new concepts. The `bundle:` prefix keeps the ids apart from database ids.

Content of Starter (about 100 phrases):

- Source language mix: roughly 80 phrases written in Canadian English, 20 written in Québécois French, then
  each translated into the other 12 languages. A test checks every phrase has every language.
- Topics for newcomers' everyday life in Canada: greetings and courtesy, asking for help or repeating,
  transit, shops and prices, restaurants, health and pharmacy, work and school, housing, phone and banking,
  weather and small talk, emergencies.
- Short, natural, mostly one sentence; some one-word or two-word quick phrases, since those are what users
  test with.
- For Québécois French sources, the French text is the Québec wording ("Je m'en vais à l'épicerie"), and
  translations should carry the meaning, not the dialect.
- Translations should be written for the language's most common regional form in the app (the first entry in
  `regions`), without regional slang. Arabic, Persian and Punjabi (Gurmukhi) are written in their normal scripts.

Review for the author: a generated, committed review file lists the phrases as a table (`id`, topic, then one
column per language) so they can be skimmed in one place (`docs/starter-review.md`). My call: it is built from
the data by a small script, kept out of the app bundle, and not required after release.

Adding a bundle later means adding one data file and one entry to a bundle list. The Source control is built
from that list, so a second bundle appears as another option (a larger menu then fits better than three
segments: later work, not this feature).

### 3.3 Language strip (Translate)

- Replace the link with a plain `div` (role-less, decorative). Keep the accessible text so a screen reader
  still hears the three languages and the detected one. The profile stays reachable from the menu (to
  verify during the work).
- Compact pills: about 32px tall, 20px flag, 14px text. These are not pressable, so the 44px rule doesn't
  apply. They keep the ring and the detected highlight.
- One row, `flex-wrap: nowrap`, `overflow-x: auto`, hidden scrollbar (`scrollbar-width: none` and the
  WebKit rule), `overscroll-behavior-x: contain`, so only the row moves and the page never scrolls sideways.
  A soft fade at the edge is optional; skip it unless the overflow looks abrupt.
- Verify at 390px wide (iPhone 13 Pro) and at 320px, with long sets such as Українська / Português / हिन्दी.

### 3.4 "Favorites" naming

Change every user-facing "Starred", "starred", "star" and "starring" to "Favorites", "favorite" and
"favoriting" where the word is about a saved phrase. This covers the Phrasebook filter label and page text,
its empty states and limit messages, the Practice copy, the deck summary, the favorite button's labels and
the server's limit error message, and any landing page copy. The star icon stays. Tests that assert the old
words are updated with the copy. Internal identifiers are not renamed. Old plan and spec documents are
history and are not rewritten.

## 4. Constraints

- Follow the parlo design system in `CLAUDE.md`: tokens only, pills at least 44px for pressables, one
  primary action per screen (Start), no emoji, language names as endonym plus flag.
- Phrase elements keep `lang` and `dir="auto"` (Arabic and Persian cards must render right to left).
- Nothing in Practice touches the model or the quota.
- Bundle data lives in code, so the Next.js client bundle carries it: about 1,300 short strings is small, but
  the builder should load the data only on the Practice page, not app-wide.
- Verify with `npm run lint`, `npm run typecheck`, `npm test`. No server or database change is planned, so
  `npm run test:int` should be unaffected (run it once if the copy change touches server tests).
- Next.js here has breaking changes: read the guide in `node_modules/next/dist/docs/` before writing page code.

## 5. Left to the builder

- Component split and file names for the setup panel and the summary line.
- The exact wording of the new copy, within the copy rules.
- Whether the Source control shows counts for Recent (cheap if its request is already loaded).
- Choosing the exact 100 phrases within the mix and topics above.
- Test strategy: unit tests for card drawing and the bundle completeness check; component tests for the setup
  flow, the empty-source state and the remembered choices; the updated copy in existing tests.

## 6. Work split

Three independent changes, each on its own feature branch and merged only when the author says so:

1. **Favorites naming** (copy only).
2. **Compact language strip.**
3. **Practice setup and Starter bundle** (the largest part: setup flow and data first, then the 100
   phrases and their review file).

## 7. Calls I made (check these)

- Source options are Favorites, Recent, Starter; "All" renamed "Recent", capped at the latest 100.
- Defaults: Starter with 10 cards on first visit; remember the last choice in `localStorage`.
- Setup collapses to a one-line summary with a Change action once Start is pressed.
- Bundle phrases can't be favorited or edited.
- Practice again re-draws randomly from the same source.
- A review table file is generated for the author to skim the 1,300 translations.
- The star icon stays; only the word changes.
