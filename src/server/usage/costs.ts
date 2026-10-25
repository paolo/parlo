/**
 * What each kind of action costs, in allowance units. The one place to change a price: the daily limit, the ring
 * and (later) purchased credits all count in these units. A translation is 1; dearer actions, such as speech or
 * graded exam feedback, get their own entry when they exist.
 */
export const ACTION_COSTS = {
  translation: 1,
} as const;

export type UsageAction = keyof typeof ACTION_COSTS;
