export type Verdict = "correct" | "almost" | "wrong";

/** Lowercase, without punctuation or symbols, with runs of whitespace collapsed. Accents are kept. */
function normalize(text: string): string {
  return text
    .normalize("NFC")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The same without accents and other combining marks: "había" and "habia" fold to one string. */
function fold(text: string): string {
  return normalize(text)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC");
}

function editDistance(a: string, b: string): number {
  const s = Array.from(a);
  const t = Array.from(b);
  let previous = Array.from({ length: t.length + 1 }, (_, j) => j);
  for (let i = 1; i <= s.length; i++) {
    const row = [i];
    for (let j = 1; j <= t.length; j++) {
      row[j] = Math.min(
        previous[j] + 1,
        row[j - 1] + 1,
        previous[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1),
      );
    }
    previous = row;
  }
  return previous[t.length];
}

/** Phrases at least this long may differ by a typo or two and still count as almost right. */
const MIN_LENGTH_FOR_TYPOS = 5;
const TYPO_SHARE = 0.15;

/**
 * Checks what the user typed against the stored phrase, without calling any model.
 * Capitalization and punctuation never matter. Missing accents and small typos are "almost": the app treats a
 * missing accent as a real mistake, so it is not "correct", but it is not "wrong" either.
 */
export function gradeAnswer(typed: string, expected: string): Verdict {
  const answer = normalize(typed);
  if (answer === "") return "wrong";
  if (answer === normalize(expected)) return "correct";

  const folded = fold(typed);
  const target = fold(expected);
  if (folded === target) return "almost";
  if (target.length >= MIN_LENGTH_FOR_TYPOS) {
    const allowed = Math.max(1, Math.floor(target.length * TYPO_SHARE));
    if (editDistance(folded, target) <= allowed) return "almost";
  }
  return "wrong";
}
