import { describe, expect, it } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { makeGroup } from "@/test/fixtures";
import { buildCards, type ReviewCard, ReviewSession } from "./session";

// With this "random" Fisher-Yates swaps every element with itself, so the order is unchanged.
const keepOrder = () => 0.999999;

const card = (id: string): ReviewCard => ({
  id,
  front: { lang: "fr", text: id, isRoot: false, correctedFrom: null },
  back: [],
});
const cards = (...ids: string[]) => ids.map(card);
const ids = (session: ReviewSession) => {
  const seen: string[] = [];
  while (!session.finished) {
    seen.push(session.current?.id ?? "?");
    session.gotIt();
  }
  return seen;
};

describe("buildCards", () => {
  it("fronts the practice language and puts the other versions on the back in profile order", () => {
    const { cards: built, skipped } = buildCards([makeGroup()], "fr", [
      "es",
      "en",
      "fr",
    ]);

    expect(skipped).toBe(0);
    expect(built).toHaveLength(1);
    expect(built[0].front.text).toBe("Il pleut des cordes");
    expect(built[0].back.map((p) => p.lang)).toEqual(["es", "en"]);
  });

  it("skips and counts groups without the practice language", () => {
    const legacy: PhraseGroupDTO = makeGroup({
      id: "legacy",
      phrases: [
        { lang: "es", text: "Hola", isRoot: true, correctedFrom: null },
        { lang: "en", text: "Hello", isRoot: false, correctedFrom: null },
      ],
    });

    const { cards: built, skipped } = buildCards([makeGroup(), legacy], "fr", [
      "es",
      "en",
      "fr",
    ]);

    expect(built.map((c) => c.id)).toEqual(["g1"]);
    expect(skipped).toBe(1);
  });
});

describe("ReviewSession", () => {
  it("shuffles once, and the same random source gives the same order", () => {
    const make = (random: () => number) =>
      new ReviewSession(cards("a", "b", "c", "d", "e"), random);

    expect(ids(make(() => 0))).toEqual(["b", "c", "d", "e", "a"]);
    expect(ids(make(() => 0))).toEqual(ids(make(() => 0)));
    expect(ids(make(keepOrder))).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("shows every card until it is graded Got it, then finishes", () => {
    const session = new ReviewSession(cards("a", "b"), keepOrder);
    expect(session.total).toBe(2);
    expect(session.finished).toBe(false);

    session.gotIt();
    expect(session.current?.id).toBe("b");
    expect(session.done).toBe(1);

    session.gotIt();
    expect(session.finished).toBe(true);
    expect(session.current).toBeNull();
    expect(session.done).toBe(2);
  });

  it("brings an Again card back after exactly 3 other cards", () => {
    const session = new ReviewSession(
      cards("a", "b", "c", "d", "e"),
      keepOrder,
    );

    session.again();

    const next: string[] = [];
    for (let i = 0; i < 4; i++) {
      next.push(session.current?.id ?? "?");
      session.gotIt();
    }
    expect(next).toEqual(["b", "c", "d", "a"]);
  });

  it("puts an Again card at the end when fewer than 3 cards remain", () => {
    const session = new ReviewSession(cards("a", "b", "c"), keepOrder);

    session.again();

    expect(session.current?.id).toBe("b");
    session.gotIt();
    expect(session.current?.id).toBe("c");
    session.gotIt();
    expect(session.current?.id).toBe("a");
    expect(session.finished).toBe(false);
  });

  it("shows a single card again after Again, and finishes once it is Got it", () => {
    const session = new ReviewSession(cards("only"), keepOrder);

    session.again();
    expect(session.current?.id).toBe("only");
    expect(session.finished).toBe(false);

    session.gotIt();
    expect(session.finished).toBe(true);
  });

  it("summarizes first-try successes and lists each retried card once", () => {
    const session = new ReviewSession(cards("a", "b", "c"), keepOrder);

    session.gotIt(); // a: first try
    session.again(); // b
    session.gotIt(); // c: first try
    session.again(); // b again
    session.gotIt(); // b finally

    expect(session.finished).toBe(true);
    const summary = session.summary();
    expect(summary.firstTry).toBe(2);
    expect(summary.retried.map((c) => c.id)).toEqual(["b"]);
  });

  it("ignores grading when there is nothing left", () => {
    const session = new ReviewSession([], keepOrder);

    expect(session.finished).toBe(true);
    expect(() => session.gotIt()).not.toThrow();
    expect(() => session.again()).not.toThrow();
  });
});
