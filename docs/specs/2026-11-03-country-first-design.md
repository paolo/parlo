# Parlo — Country First Design

Extends [`2026-11-02-practice-first-design.md`](2026-11-02-practice-first-design.md) (the landing game and the signup
language picker). Where they disagree, this document wins for how a native language is picked.

## 1. Intent

The landing game offered languages, each with one flag: Spanish got Spain's, Portuguese got Portugal's. Most
Spanish speakers who come to Canada are probably from Mexico or Colombia, and most Portuguese speakers from Brazil, so the
flag felt like someone else's. Parlo is for newcomers and should make them feel identified: **ask where you are
from first**, then the language when the country has more than one.

The country is also kept, not only the language. It is the region that tunes the slang Parlo suggests, and it is the
flag shown on the cards.

### Goals

- Landing game and the native slot of the signup language picker start with "Where are you from?": a searchable
  grid of countries, each a flag and the country's name.
- A country with exactly one of Parlo's languages starts straight away. A country with more than one (Ukraine,
  India) asks "Which language?" next.
- The picked country travels with the language: the cards show its flag, the signup picker arrives with
  "Español · Bolivia", and the profile saves region `BO`.
- "My country isn't listed" falls back to picking a language directly, so nobody is stuck.

### Non-goals

- New languages (Haitian Creole, Wolof, Hausa, Yoruba and so on): each would need about 100 reviewed Starter phrases.
- Ranking countries by how many newcomers come from them: there is no data, so the grid is alphabetical.
- Changing the second and third slots of the signup picker.

### Anti-goals

- No country is offered that has none of the languages on offer: nobody should pick a country and find nothing.
- English and French are still not offered as the native pick on the landing page (they are the languages being
  learned); the signup picker's native slot still offers all 13.

## 2. Decisions made with the user

- Country first, then language only where the country has several (the author's own words: "pick my country first,
  in my case Bolivia, then, if needed, pick a language").
- The signup picker's native slot becomes country-first too, as well as the landing game.
- Work continues on the `practice-landing-game` branch; no extra branches stacked on top.

## 3. Design

- The countries on offer come from the languages' own region lists (`LANGUAGES[lang].regions`): for the landing game,
  the countries of every language except English and French; for the signup picker, those of all 13.
- The saved visitor pick becomes a language plus a country. A pick saved by the earlier version (just a language)
  still works and takes that language's default country.
- The country search matches the country's English name, ignoring case.
- **Calls made by the author of this document:** the "My country isn't listed" fallback shows languages as text pills
  without flags (a flag would repeat the problem); after the fallback the country is the language's default one;
  in the signup picker, once the native slot has a language it behaves as before (language and country chips) so
  it can be edited.
