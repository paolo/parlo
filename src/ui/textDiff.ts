export interface DiffPart {
  kind: "same" | "add" | "del";
  text: string;
}

const graphemes = (text: string): string[] =>
  Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    (s) => s.segment,
  );

/**
 * What changed between two short texts, letter by letter (a letter being a grapheme, so an accent or an emoji's
 * skin tone never comes apart). A longest-common-subsequence diff: fine for phrases, which are at most 500
 * characters. Neighbouring parts of the same kind are merged, and where text changes the deletion comes first.
 */
export function diffChars(from: string, to: string): DiffPart[] {
  const a = graphemes(from);
  const b = graphemes(to);
  // lcs[i][j]: length of the longest common subsequence of a[i..] and b[j..].
  const lcs = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (kind: DiffPart["kind"], text: string) => {
    const last = parts.at(-1);
    if (last?.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  // Deletions and additions between two shared letters are gathered, then written deletions first.
  let dels = "";
  let adds = "";
  const flush = () => {
    if (dels) push("del", dels);
    if (adds) push("add", adds);
    dels = "";
    adds = "";
  };
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      flush();
      push("same", a[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      dels += a[i++];
    } else {
      adds += b[j++];
    }
  }
  dels += a.slice(i).join("");
  adds += b.slice(j).join("");
  flush();
  return parts;
}
