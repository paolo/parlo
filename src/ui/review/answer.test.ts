import { describe, expect, it } from "vitest";
import { gradeAnswer } from "./answer";

describe("gradeAnswer", () => {
  it("accepts the phrase exactly", () => {
    expect(gradeAnswer("Il pleut des cordes", "Il pleut des cordes")).toBe(
      "correct",
    );
  });

  it("ignores capitalization, punctuation and extra spaces", () => {
    expect(
      gradeAnswer("  il pleut   des cordes ", "Il pleut des cordes."),
    ).toBe("correct");
    expect(gradeAnswer("que tal", "¿Qué tal?")).not.toBe("wrong");
    expect(gradeAnswer("¡Qué  tal!", "¿Qué tal?")).toBe("correct");
  });

  it("treats a missing accent as almost, not correct", () => {
    expect(gradeAnswer("Que tal", "Qué tal")).toBe("almost");
    expect(
      gradeAnswer("Coûter les yeux de la tete", "Coûter les yeux de la tête"),
    ).toBe("almost");
  });

  it("forgives a small typo in a longer phrase", () => {
    expect(gradeAnswer("Il pleut des cordse", "Il pleut des cordes")).toBe(
      "almost",
    );
  });

  it("does not forgive typos in very short phrases", () => {
    expect(gradeAnswer("chat", "chap")).toBe("wrong");
    expect(gradeAnswer("Ok", "Oh")).toBe("wrong");
  });

  it("marks a different phrase and an empty answer wrong", () => {
    expect(gradeAnswer("It's pouring", "Il pleut des cordes")).toBe("wrong");
    expect(gradeAnswer("   ", "Il pleut des cordes")).toBe("wrong");
    expect(gradeAnswer("?!", "Il pleut des cordes")).toBe("wrong");
  });

  it("works with other scripts", () => {
    expect(
      gradeAnswer("Вішати локшину на вуха", "вішати локшину на вуха!"),
    ).toBe("correct");
    expect(gradeAnswer("我爱你", "我爱你。")).toBe("correct");
    expect(gradeAnswer("我恨你", "我爱你")).toBe("wrong");
  });

  it("does not let a long wrong phrase pass on length alone", () => {
    expect(
      gradeAnswer("Il fait un froid de canard", "Il pleut des cordes"),
    ).toBe("wrong");
  });
});
