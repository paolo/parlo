import type { Lang } from "../../shared/languages";
import type { PhraseGroupDTO } from "../phrases/types";

/**
 * The lines of a successful POST /api/translations, in the order they can arrive. `detected` and
 * `translation` are early looks at an answer still being written; `done` carries the stored group and ends
 * the stream, or `error` does when the answer could not be completed after it had started.
 */
export type TranslationEvent =
  | { type: "detected"; lang: Lang }
  | { type: "translation"; lang: Lang; text: string }
  | { type: "done"; group: PhraseGroupDTO }
  | { type: "error"; error: "translation_failed" };
