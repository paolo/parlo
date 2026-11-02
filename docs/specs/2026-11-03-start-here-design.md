# Parlo — Start Here (landing page) Design

Extends [`2026-11-02-practice-first-design.md`](2026-11-02-practice-first-design.md). Where they disagree, this document
wins for how a visitor picks a language, the landing page's sections and the closing title.

## 1. Intent

A first try at asking visitors **where they are from** (country first, then the language) was set aside: too many
countries share one language, and a long list of countries gets in the way. The landing page goes back to picking a
language, but makes it feel more like theirs: once a language is picked, all its countries show as flags, so a
Bolivian can choose Bolivia, not Spain.

The page also says "made for newcomers", so the cards and the language picker become one section that reads as a
journey: **start here** (the language you grew up with), **we'll bring you there** (English and French).

### Goals

- One section, "Start here. We'll bring you there.", replaces the separate game and languages sections: language
  cards first, then the round.
- A language card looks as the languages grid did: name, endonym and up to four flags. Picking a language opens it to
  show all its countries (flag and name), the first selected, and a Play button. A language with one country starts
  at once.
- The country goes with the pick: the cards show its flag and the signup picker arrives with, for example,
  "Español · Bolivia".
- The closing title is "Your next [bus ride] could be a lesson.", with the moment changing every few seconds
  (bus ride, Uber ride, wait in line, coffee break, flight, lunch break, walk to work, grocery run).
- The practice section no longer leans on the bus idea: it is about practice.

### Non-goals

- Changing the language and region picker inside the app (it is back to language first; it can look more like this later).
- Country-first picking and a short list of common countries (tried and removed).
- Ranking languages or countries.

### Anti-goals

- No sign-in before the first card; no request of ours from a visitor's round.
- No motion that ignores `prefers-reduced-motion`: with it, the closing title stays on "bus ride".

## 2. Decisions made with the user

- Work stays on the `practice-landing-game` branch.
- Revert the in-app language and region picker to language first for now.
- One "start here, we'll bring you there" section: language cards, then all flags once one is picked, then the game.
- English and French are the destination by default, but they also get their own two cards, set apart under "Already
  speak English or French? Start from it." Starting from English brings French and Spanish; starting from French
  brings English and Spanish (Spanish is the author's pick for the third). Everyone else gets their language, then
  English and French.
- The closing line rotates through everyday moments instead of fixing on the bus.

## 3. Calls made by the author of this document

- A language with one country (Ukrainian, Tagalog, Hindi) starts the round on the click; there is nothing to choose.
- The first country of a language is selected when its countries show, so Play works without choosing.
- The three "how it works" steps stay, now in a row under the cards, with the "between stops" wording changed to
  "a few minutes a day".
- Their countries are listed too, so someone from Nigeria, India, Haiti or Senegal has a card to start from.
- The hero button stays "Play a round" and jumps to this section.
