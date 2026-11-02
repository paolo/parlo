# Parlo — Practice First (epic 1) Design

Extends [`2026-10-26-practice-starter-deck-design.md`](2026-10-26-practice-starter-deck-design.md) (Practice and the
Starter bundle), [`2026-10-22-landing-page-design.md`](2026-10-22-landing-page-design.md) (the landing page) and
[`2026-10-25-redesign-design.md`](2026-10-25-redesign-design.md) (look and feel). Where they disagree, this
document wins for tab order, the page shown after login, the Practice start and the landing page's game.

## 1. Intent

Parlo was shared with friends from French classes (about 14 people; 3 signed up; 2 of those tried one
translation and stopped; one kept using it, about 7 translations). The author uses it mostly live in class,
bridging what a French teacher says into Spanish, English and Ukrainian for classmates. The classmates already
have Google and Apple Translate on their iPhones, so a translator alone gives them no reason to come back.

What brings someone back is practice. Most of those classmates are newcomers to Canada preparing for the
TCF/TEF. So Parlo's direction becomes: **learn French and/or English starting from the languages you already
speak**, with the three-language focus kept. Translation stays, but as a tool inside that: a way to capture
what you just heard. The colloquial spin ("say it like a local") stays; formal phrasing and exam-style
practice can come later as more bundles or levels.

This first epic is small on purpose. It mostly moves existing pieces so that practice becomes the front door,
both for visitors and for signed-in users. It adds no new content and no new server features.

### Goals

- A signed-out visitor can **play a round of Starter cards on the landing page** within a few seconds, without
  signing in and without a profile.
- A visitor picks only their **native language**. English (Canada) and French (France) are the second and third
  languages by default.
- A signed-in user lands on **Practice** after login, with a round of Starter cards **already dealt**, and can
  change the setup in one tap.
- The tab order is **Practice, Translate, Phrasebook**.
- A visitor's native-language pick **carries over** to the language picker they meet after signing up.
- At the end of a landing round the visitor is invited to sign up, with copy that promises only what exists.

### Non-goals

- Saving progress, streaks, scores, rankings or any new Practice data on the server (the next epic).
- Listening (read-aloud), speaking, or any new answer mode. "Say it" stays disabled as it is.
- New bundles, new phrases, or exam-oriented content. Starter is unchanged.
- Removing or hiding translation. It stays a first-class tab.
- Spaced repetition, and changes to how Favorites or Recent work.
- Moving routes. URLs stay as they are (see section 4, call 3).
- A new marketing site, a new brand or new metadata and link-preview images.

### Anti-goals

- A visitor's round must not call the model, touch the quota, or write anything to the server.
- No fake promises: copy must not claim progress saving or anything else that does not exist yet.
- A visitor must not be asked to sign in, or to pick three languages, before seeing their first card.
- Practice must not become harder to reach or to reconfigure for people who already use it today.
- Translation must not be buried or lose features.

## 2. Decisions made with the user

- Direction: practice-first, translation as a tool; target newcomers learning French and/or English, first in
  Canada, without naming Canada or the exams in the copy.
- Keep the three-language focus and the colloquial voice.
- Landing page: shift the focus to the cards, reusing the Starter bundle; visitors pick their native language;
  English (Canada) and French (France) are the default second and third; they can play straight away.
- After login: Practice is the first tab, followed by Translate and Phrasebook.
- A **preconfigured game** runs straight away from the Starter bundle; the user can reconfigure it.
- At the end of a landing round, invite the visitor to sign up to keep playing. Saving progress comes in a
  later epic, so the invitation must not promise it.
- Later epics, not this one: practice experiences (listening, speaking if feasible), then gamification
  (streaks and goals first; points and rankings only when there are enough users).
- The author wants users to feel at home. A likely next step (epic 2): on the landing page ask **where they are
  from** first, then offer the language, and use phrases from their home country. Today the picker goes
  language first, then region. Not part of this epic.

## 3. Design

### 3.1 A practice round that needs no login

Today `ReviewView` needs a session, a complete profile, and the Favorites and Recent queries. Add a variant that
runs a round from **three languages given as input**, the Starter bundle only, flip mode, with no profile and no
server queries. The existing session logic, card and answer panels already take their languages and cards as
props and should be reused as they are. Anything inside them that calls the server (for example a Favorite
star) is hidden in this variant.

The signed-in Practice page and the landing game share this round, so they look and behave the same.

### 3.2 The landing page game

Replace `PracticeDemo` (a fixed three-card deck) with a playable round of ten Starter cards.

- A **native-language picker** comes first, as a row of pills (flag plus the language's own name). It lists the
  languages Parlo supports except English and French. The second and third languages are not asked for.
- Defaults for the other two: English with region Canada (`CA`) and French with region France (`FR`).
- Picking a language starts the round at once. The round is the in-app one: ten random Starter cards in flip
  mode. **The front of each card is the visitor's native language**; Reveal shows English and French. So a
  Spanish speaker sees the Spanish phrase and then recalls and reveals the English and the French.
- The pick is remembered in the browser, so a returning visitor lands in the game already set up.
- **End of round:** the visitor sees a short invitation to sign up to keep playing the whole deck, star phrases
  into a phrasebook, and translate their own phrases. "Play another round" stays available; there is no
  hard gate (section 4, call 2).
- The hero's job moves from "a translator" to "practice phrases you'll really hear". The builder drafts the
  copy in the site's voice (short, warm, plain, no emoji); the author reviews and edits it.
- Everything else on the landing page (header, languages grid, closing call to action, footer) stays, with
  copy adjusted only where it contradicts the new direction.

### 3.3 Carrying the pick over to signup

When a visitor picks a native language, store it in the browser under one `localStorage` key (a cookie would
also work, but a query parameter would not survive the Google sign-in redirect). After signing up, the
language picker for a user with an empty profile is **pre-filled**: slot 1 is the stored native language, slot
2 is English (Canada), slot 3 is French (France). The user still sees and confirms the picker, and can change
anything. Once a profile is saved the stored value is removed. Reading and writing storage is wrapped so that
a blocked or empty store changes nothing.

### 3.4 Inside the app

- **Tab order:** Practice, Translate, Phrasebook, in the bottom bar and in the header navigation.
- **After login:** sign-in callbacks and the logo link go to Practice. Translate stays at `/`.
- **Practice start:** the page deals a round immediately using the saved preferences (default: Starter, 10
  cards, flip) instead of showing the setup first. The existing setup (source, count, mode, languages) is
  reachable in one tap from the round ("Change setup") and still behaves as today. When the saved source is
  Favorites and the user has none, the existing fallback to Starter applies.
- A new user still meets the language picker before Practice, as they do today on every page that needs a
  profile; section 3.3 makes it quick for people who played on the landing page.

### 3.5 Look and feel

Follow the parlo design system (`src/styles/tokens.css`, `src/ui/theme.ts`): CSS Modules and `var(--parlo-*)`
tokens only, three role colors by profile position, a language is always its circular flag plus its endonym,
everything pressable is a pill of at least 44px, one primary action per screen, motion respects
`prefers-reduced-motion`, no emoji. Reuse `Flag`, `PhraseCard` and the existing Practice components first.
New shared pieces go in `src/ui/` with their own `.module.css`.

## 4. Calls made by the author of this document (check these)

1. **English and French are not offered as the native pick on the landing page.** The defaults for second and
   third are English and French, so a native English or French speaker would collide with them. The audience is
   people learning those languages. They can still choose any languages after signing up.
2. **No hard gate after round one.** "Keep playing" is an invitation, and "Play another round" still works for
   visitors. A hard gate would bring back the login wall that was suspected of costing sign-ups.
3. **URLs do not move.** Translate stays at `/`; Practice stays at `/practice`; only the order of the tabs and
   the post-login destination change.
4. **The in-app Practice always deals first.** Returning users also get a round dealt immediately from their
   saved preferences, with setup one tap away.
5. **No Favorite star in the landing round.** Starring needs an account.
6. **Region defaults:** English (Canada) and French (France) are set explicitly. Today the profile's English
   region would default to another region.

7. **Existing preferences stay as they are.** Only source and count are remembered today. The immediate deal
   uses the saved source and count, always flip mode, and the practice and answer languages default as they do
   today. Remembering mode or languages is not part of this epic.
8. **"Change setup" discards the round in progress** and Start deals a new one, as today. Losing a half-played
   round is acceptable.
9. **A stored native pick is validated** against the supported languages and silently dropped when it is not
   valid. It is also cleared when a signed-in user already has a profile, so it never lingers.
10. **The landing round has no setup controls at all**, not even a practice-language choice: the native
    language is always on the front (decided with the author).
11. **The immediate deal in the signed-in Practice page also puts the native language on the front**, so someone
    who played on the landing page sees the same kind of card after signing up. The "Practice in" menu still
    changes it for that round, and the choice is not remembered (as today). Veto this if the in-app default
    should stay on the second language.

Checked in the project: `CA` is one of English's regions and `FR` is one of French's, and the Starter bundle has
non-empty text in all 13 languages (asserted by `starter.test.ts`), so every pill on the landing page works.

## 5. Left to the builder

- Component names, file layout and how the shared round is factored, as long as the signed-in Practice page
  and the landing game share it.
- The exact look of the native-language pills and of the end-of-round invitation, within the design system.
- The wording of the hero and the invitation (a draft for the author to edit).
- How to avoid a flash of the setup screen before the first round is dealt.
- Tests: follow the existing ones (unit and UI projects; integration only if server code changes). Update the
  tests that assert tab order and the post-login destination.

## 6. Order of work

The three pieces depend on each other in this order, and each is one branch-sized step:

1. The login-free round and the immediate deal in the signed-in Practice page.
2. Tab order and post-login destination.
3. The landing game and the carry-over to the language picker.

## 7. Verification

`npm run lint`, `npm run typecheck`, `npm test`. Try the landing page signed out and in a private window, on a
phone-width screen, in light and dark, and with reduced motion on.
