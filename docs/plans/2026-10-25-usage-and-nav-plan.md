# Usage, navigation and practice: plan

Agreed 2026-10-25. Pricing intent: cover running costs only; maybe a small business later (CELPIP and TCF exam
prep is the candidate paid feature). No payment provider yet.

Cost check (Haiku 5.5, 50 translations a day, 500 characters each): worst case about $1.30 a month per person,
typical $0.30 to $0.60. The $10 a month budget covers roughly seven users maxing out every day.

## Decisions

- One Phrasebook page replaces History and Phrasebook: filter All / Starred, plus the existing "Show in" control.
- Three tabs: Translate, Phrasebook, Practice. Profile and settings stay behind the avatar.
- Review becomes Practice at `/practice`. `/history` and `/phrasebook/review` redirect.
- Usage becomes a generic allowance (an action type has a cost) shown as a ring around the avatar, not a counter.
  Free refilling allowance now; prepaid credit packs at cost later; a subscription only once the value is clear.
- Practice gets more answer modes in steps: speak aloud (now), typed (string match first, model only when close),
  spoken (browser recognition first, cloud speech later, spending allowance).

## Steps (one branch each, merged with `--no-ff` after the author says so)

- [x] 1. Phrasebook merge and three-tab navigation (merged).
- [x] 2. Allowance model and avatar ring replacing the counter. Ring and warning tokens done (`usage-ring`: neutral,
  amber at 20% left, red when out). Ledger done (`usage-ledger`): `translation_usage` rows carry
  an action, a cost in allowance units (`ACTION_COSTS`) and the model's token counts; today's usage is the sum of
  costs. `npm run usage:cost` totals real spend per day. Migration 0002 is additive (old rows get cost 1), but the
  new code writes the new columns: run the migration on Neon before or with the deploy, or translations fail
  until it lands.
  Log token usage per translation so real cost shows up.
- [x] 3. Typed answers in Practice (`practice-typed`): Flip / Type mode, choose the language to type in; checked
  locally (`answer.ts`): correct, almost (missing accent or small typo) or wrong, with "I was right" to overrule.
  No model call yet: a model check for valid synonyms would spend allowance and is left for later.
- [ ] 4. Later: voice, payments, exam prep (each its own spec).

## Not doing yet

Payments, a company or payment account, spoken-answer checking, exam prep.
