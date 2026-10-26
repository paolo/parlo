# Parlo — Favorites from the Practice card Design

Extends [`2026-10-26-practice-starter-deck-design.md`](2026-10-26-practice-starter-deck-design.md). Where they
disagree, this document wins for the card header and for Starter phrases becoming saved phrases.

## 1. Intent

A user practicing Starter phrases (or Recent ones) may want to keep one: favorite it and practice from it later.
The star goes on the Practice card, at the far right of the language tag, for every source, and also removes a
favorite.

### Goals

- A star button on every Practice card (flip and type), toggling the phrase's favorite state.
- Starring a Starter phrase saves it to the user's phrasebook, in their profile languages, and counts toward the
  phrasebook cap.
- Starring the same Starter phrase twice never makes a duplicate; the star shows filled whenever the user has
  it as a favorite, including in later sessions.
- Starring or un-starring never changes the round in progress: no card is added, removed or reordered.

### Non-goals

- Editing Starter phrases, or favoriting from the Done screen.
- A copy of every Starter phrase for every user: a phrase is only saved when starred.

### Anti-goals

- No duplicate saved phrases.
- No model call and no quota use.
- Un-starring must not clutter history with Starter phrases the user dropped.

## 2. Decisions made with the user

- The star works on Favorites, Recent and Starter cards, and can un-favorite.
- "Practice again" keeps dealing a fresh random draw. A phrase un-starred during a round can therefore leave the
  next draw from Favorites; the current round never changes.

## 3. Design

### 3.1 Server

- `phrase_group` gets a nullable `bundle_ref` text column, `"<bundleId>:<phraseId>"` (for example
  `starter:starter-014`), with a unique index on `(user_id, bundle_ref)` where it is not null. Additive
  migration: run it on Neon before or with the deploy.
- `PUT /api/bundle-favorites/:bundleId/:phraseId` makes that bundle phrase a favorite of the user and returns
  `{ group }`. If the user already has a group for it, that group is favorited again; otherwise a group is created
  from the bundle phrase with one phrase per language of the user's profile, favorited. The root is the
  phrase's source language when it is in the profile, otherwise the user's first language (my call). 404 for an
  unknown bundle or phrase, 409 `phrasebook_full` at the cap, 409 `profile_incomplete` without a profile.
- `DELETE /api/bundle-favorites/:bundleId/:phraseId` deletes the user's group for that phrase, if any, and
  answers 204 either way. Starter phrases the user dropped do not pile up in Recent.
- `PhraseGroupDTO` gets `bundleRef: string | null`.
- Un-starring from the Phrasebook page stays the existing PATCH (the group stays in history); a later star finds
  it by its ref and favorites it again.

### 3.2 Client

- `bundleToGroups` sets `bundleRef` on its groups; `ReviewCard` carries `bundleRef`.
- A star button in the card header (`PracticeDeck`), pill-sized, with labels "Add to favorites" and "Remove from
  favorites". It reads its state from the favorites list (a group with the card's id, or with the card's
  `bundleRef`), shows the requested state while saving, and notifies on failure (phrasebook full and the rest).
  A card with a `bundleRef` toggles through the bundle endpoints; any other card through the existing PATCH.
- The round's cards are fixed when it starts, so nothing here touches them. The summary line's card count is
  fixed at Start too, so un-starring does not change it.

## 4. Constraints

Same as the starter deck design. Pressable at least 44px; tokens only; the card's text colour is
`--parlo-on-accent`, so the star uses the role's ink token.

## 5. Left to the builder

Star icon placement details and the exact notification copy, within the copy rules.
