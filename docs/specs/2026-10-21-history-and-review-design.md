# Parlo — History, Phrasebook Limits and Review Mode Design

Extends [`2026-10-09-parlo-design.md`](2026-10-09-parlo-design.md) and
[`2026-10-20-language-profile-design.md`](2026-10-20-language-profile-design.md). Where they disagree, this
document wins for the History page, the Phrasebook page and the phrase-group list API.

## 1. Intent

Every translation is already stored as a phrase group, but the app only shows the one just made, and the
Phrasebook is a plain list of starred groups. This work makes saved phrases usable:

1. **History** lists everything the user translated, newest first, with paging and delete.
2. **Limits** keep the stored data bounded from day one (an MVP choice: limits are easy to raise later and
   painful to lower once people have data).
3. **Review mode** turns the Phrasebook into something to study: flashcards in a language the user picks.
4. **Search** (a later phase, §7) makes saved phrases findable.

The people using it are immigrants in Canada who translate between three languages; the Phrasebook is where
they keep phrases they want to learn. Review mode is what should make it stand out.

### Goals

- History page with cursor paging, a per-language view and single-item delete.
- Phrasebook page with the same paging, plus a Review entry point.
- Configurable limits, defaulting to 500 history groups and 100 starred groups per user.
- Review mode v1: a client-side flashcard session with self-grading, no model calls.

### Non-goals

- Listen (text to speech), speaking or pronunciation scoring, typed answers, style variants and spaced
  repetition. They come later, each as its own feature.
- Paid tiers or plan-based limits.
- Accepting a suggested correction from History (stays in the living plan under 1.8).
- Search in the first plan (§7 describes it so the API does not paint it into a corner).

### Anti-goals

- Starred phrases must never be deleted automatically.
- Pruning must not be silent: the History page says what it keeps.
- Review mode must not call the model or touch the daily quota.
- A new user with no history, or with fewer than one starred phrase, must see a clear empty state with a way
  forward, not a blank page.

## 2. Decisions already made with the user

- Cursor paging with a "Load more" button, 20 groups per page. Not infinite scroll, not offset paging.
- History keeps the latest **500** groups per user; older unstarred groups are removed when a new one is
  saved. Starred groups are exempt.
- The Phrasebook holds at most **100** starred groups; starring past that is refused with a clear message.
- Both limits are configuration (environment variables), so they can be raised without a code change.
- Order of work: History and limits, then Review mode, then search.
- Review mode v1: pick the practice language (default: the user's second language, so French for the
  author; English or any profile language can be chosen), read the card, reveal the other versions, then
  self-grade. No Listen in v1.
- The existing 50 translations a day and 10 per minute stay as they are.

## 3. List API and paging

`GET /api/phrase-groups` replaces the current favorites-only handler.

- Query: `favorite=true` (optional), `limit` (default 20, 1 to 100), `cursor` (optional, opaque).
- Response: `{ items: PhraseGroupDTO[], nextCursor: string | null }`.
- Order: `created_at desc, id desc`, the existing index. The cursor encodes the last item's `(created_at, id)`
  (base64url JSON); the query is a keyset condition `(created_at, id) < (cursor)`. A malformed cursor is a
  400 `invalid_input`.
- `favorite=true` returns only starred groups, same paging and order. Its `limit` may be up to 100 so Review
  mode can load the whole Phrasebook in one request.
- Groups come with their phrases as today (`phrases` is the ordered list from the language profile work).

`DELETE /api/phrase-groups/:id` → 204; 404 if the group is not the caller's. Deleting never restores daily
quota (existing rule).

## 4. Limits

New environment variables, validated in `src/server/env.ts` next to the existing limits and documented in
`.env.example`: `HISTORY_LIMIT` (default 500), `PHRASEBOOK_LIMIT` (default 100). Both positive integers.

- **History pruning:** after a translation is saved, if the user has more than `HISTORY_LIMIT` groups, delete
  the oldest groups that are not starred until the count is `HISTORY_LIMIT` (or only starred groups remain;
  `PHRASEBOOK_LIMIT` is below `HISTORY_LIMIT` in the defaults, but the code must not loop or delete starred
  groups if an operator configures it the other way round). Pruning happens in the same transaction as the
  insert.
- **Phrasebook cap:** `PATCH /api/phrase-groups/:id { isFavorite: true }` returns 409
  `{ error: "phrasebook_full", limit }` when the user already has `PHRASEBOOK_LIMIT` starred groups and the
  target is not one of them. Starring an already starred group, and unstarring, always succeed.
- The UI explains both: History shows "Keeps your last 500 phrases. Starred phrases stay." and a refused star
  shows "Your phrasebook is full (100). Remove one to add another."

## 5. History page

Replaces the "Coming next" placeholder. Behind the profile gate like every page.

- A list of groups, newest first, loaded 20 at a time with a "Load more" button that disappears when
  `nextCursor` is null.
- Each group shows its phrases (profile order, original first, as in the translate result), the correction
  when there is one, the date, the star button and a delete button. The delete asks for confirmation.
- A "Show in" control: **All** (default) or one of the user's languages. A single language shows just that
  language's text for each group, which makes the list scannable; groups that lack that language (older groups
  from before the profile existed) are shown with their original instead and marked.
- Empty state: "Nothing here yet. Translate something and it will show up." with a link to Translate.
- The note about the 500 limit sits under the list header.

The Phrasebook page uses the same list component with `favorite=true`, "Load more", and an empty state that
explains starring. It adds a **Review** button (disabled when nothing is starred).

## 6. Review mode v1

Route `/phrasebook/review`, linked from the Phrasebook page. Purely client-side after one fetch of the
starred groups (`favorite=true&limit=100`). No model calls, no quota, no server writes, no stored results.

- **Practice language:** a selector with the user's three languages, defaulting to the second one (position
  1). Changing it restarts the session. Groups without a phrase in that language are skipped, and a line
  says how many ("3 phrases skipped: no French version").
- **Session:** the cards are shuffled once per session. The front shows the phrase in the practice language.
  **Reveal** shows the user's other languages (profile order). Then **Got it** or **Again**.
- **Again:** the card returns to the queue a few cards later (after 3 other cards, or at the end when fewer
  than 3 remain). **Got it:** the card leaves the queue. The session ends when the queue is empty.
- A progress indicator shows cards done out of the total.
- **Summary:** how many were "Got it" on the first try, how many needed more tries, and the list of phrases
  that needed more than one try; buttons "Practice again" (new shuffle, same language) and "Back to
  phrasebook".
- **Empty state:** no starred groups (or all skipped) → explains and links to Translate.
- Randomness is injectable so the session logic is deterministic in tests. The session logic lives in a
  plain module (no React) that the view drives.

## 7. Search (later phase, own plan)

`GET /api/phrase-groups?q=` filters by a case-insensitive substring of any phrase text of the group
(`ILIKE` with escaped wildcards), at least 2 characters, combinable with `favorite=true` and the paging
above; the UI gets a search box with debounce on History and the Phrasebook. Not part of the first plan.
The list API above is shaped so that it only adds a condition.

## 8. Constraints and risks

- `src/server/**` never imports from `next/*`; the list and limit logic sit behind the existing
  `PhraseRepository` interface.
- The list route must stay scoped to the session user in every query (no id-only lookups).
- Reading a large page of groups must not issue one query per group (use the relational `with: { phrases }`
  already used by the repository).
- Old groups can hold languages the user no longer has (language profile work); every view must cope.
- Review mode shuffles and re-queues in memory: 100 cards at most, so no persistence or paging is needed.

## 9. Testing

- Repository (int): keyset paging returns pages in order with no duplicates or gaps across a page boundary,
  including groups created in the same millisecond (tie on `created_at`); `nextCursor` is null on the last
  page; other users' groups never appear; delete removes only the caller's group; pruning removes the oldest
  unstarred groups beyond the limit and never a starred one, and leaves the newest; the starred cap refuses
  the 101st star but allows re-starring and unstarring.
- Routes: 400 for a bad `limit` or cursor, 404 on deleting someone else's group, 409 `phrasebook_full`
  carries the limit, 401 without a session.
- Env: the new variables have the defaults above and reject zero or non-numbers.
- Review session logic: every card appears until graded "Got it"; "Again" re-queues after 3 cards; the
  summary counts first-try successes correctly; groups lacking the practice language are skipped and
  counted; the same seed gives the same order.
- UI: History loads more and hides the button at the end; delete asks for confirmation and removes the item;
  the "Show in" control switches language and marks groups that lack it; empty states; Phrasebook Review
  button disabled when empty; Review view reveals, grades and ends in a summary.
- Manual: with a real account, translate a few phrases, star some, run a review session in French on a
  phone-sized window.

## 10. Left to the builder (calls already made, flagged for the user to check)

- Limits as environment variables with the defaults above, pruning inside the insert transaction.
- 409 `phrasebook_full` as the refusal shape.
- The "Show in" control and how groups without that language display.
- Group display on History reuses the translate result's look, in a more compact form.
- Re-queue distance of 3 cards, and the summary content.
- The practice language is not remembered between sessions.
