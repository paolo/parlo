import type { PhraseDTO, PhraseGroupDTO } from "@/server/phrases/types";
import type { Lang } from "../../shared/languages";
import { orderPhrases } from "../phrases";

export interface ReviewCard {
  id: string;
  /** The phrase in the practice language. */
  front: PhraseDTO;
  /** The group's other phrases, shown on reveal. */
  back: PhraseDTO[];
  /** The phrase to type, when practicing by typing. */
  answer?: PhraseDTO;
}

/**
 * One card per group that has a phrase in the practice language; the rest are counted as skipped. With
 * `answerLang` (typing), the group also needs a phrase in that language, which becomes the card's `answer`.
 */
export function buildCards(
  groups: PhraseGroupDTO[],
  practice: Lang,
  profileLangs: Lang[],
  answerLang?: Lang,
): { cards: ReviewCard[]; skipped: number } {
  const cards: ReviewCard[] = [];
  let skipped = 0;
  for (const group of groups) {
    const front = group.phrases.find((p) => p.lang === practice);
    const answer = answerLang
      ? group.phrases.find((p) => p.lang === answerLang)
      : undefined;
    if (!front || (answerLang && !answer)) {
      skipped += 1;
      continue;
    }
    cards.push({
      id: group.id,
      front,
      answer,
      back: orderPhrases(group.phrases, profileLangs).filter(
        (p) => p.lang !== practice,
      ),
    });
  }
  return { cards, skipped };
}

/** A shuffled copy of `items`, cut to `count`: all of them when there are fewer. */
export function pickRandom<T>(
  items: T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

/** How many other cards come before a card graded "Again" is shown once more. */
const AGAIN_DISTANCE = 3;

/** A flashcard session: shuffled once, "Again" cards return later, "Got it" cards leave. */
export class ReviewSession {
  private readonly queue: ReviewCard[];
  private readonly againCount = new Map<string, number>();
  private readonly retried: ReviewCard[] = [];
  private firstTry = 0;
  private gotItCount = 0;
  readonly total: number;

  constructor(cards: ReviewCard[], random: () => number = Math.random) {
    this.queue = [...cards];
    this.total = cards.length;
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  get current(): ReviewCard | null {
    return this.queue[0] ?? null;
  }

  get finished(): boolean {
    return this.queue.length === 0;
  }

  /** Cards graded "Got it" so far. */
  get done(): number {
    return this.gotItCount;
  }

  gotIt(): void {
    const card = this.queue.shift();
    if (!card) return;
    this.gotItCount += 1;
    if (!this.againCount.has(card.id)) this.firstTry += 1;
  }

  again(): void {
    const card = this.queue.shift();
    if (!card) return;
    const times = this.againCount.get(card.id) ?? 0;
    if (times === 0) this.retried.push(card);
    this.againCount.set(card.id, times + 1);
    this.queue.splice(Math.min(AGAIN_DISTANCE, this.queue.length), 0, card);
  }

  summary(): { firstTry: number; retried: ReviewCard[] } {
    return { firstTry: this.firstTry, retried: [...this.retried] };
  }
}
