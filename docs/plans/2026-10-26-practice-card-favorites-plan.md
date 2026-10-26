# Favorites from the Practice card: plan

Spec: `docs/specs/2026-10-26-practice-card-favorites-design.md`. Branch `practice-card-favorites`, cut from
`practice-starter-deck`; merge after it. Verify with `npm run lint`, `npm run typecheck`, `npm test` and
`npm run test:int` (needs `npm run db:up`).

- [ ] 1. Schema and repository: `bundle_ref` column and migration; `PhraseGroupDTO.bundleRef`;
  `PhraseRepository.favoriteBundleGroup(group: NewPhraseGroup & { bundleRef: string })` and
  `deleteBundleGroup(userId, bundleRef): Promise<boolean>`. Int tests: creates a favorite group; second call reuses
  it; re-favorites a group that was un-starred; respects the phrasebook cap (and lets an already-favorite one
  through); delete removes it, is idempotent, and only touches the user's own.
- [ ] 2. Bundle group builder and routes: `buildBundleGroup(userId, bundleId, phraseId, languages)` (unit tests:
  profile languages only, root rule, unknown ids); `PUT`/`DELETE /api/bundle-favorites/...` with route tests
  (401, 404, 409 full, 409 no profile, 204 idempotent).
- [ ] 3. Client: `bundleRef` on bundle groups and cards; `useSetBundleFavorite`; the card star in `PracticeDeck`;
  summary count fixed at Start. Tests: star states for each source, toggling a Starter card calls PUT then
  DELETE, no card changes in the round, the star shows filled in a later round, failures notify.
