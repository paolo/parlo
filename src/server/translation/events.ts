import type { Lang } from "../../shared/languages";
import type { PhraseGroupDTO } from "../phrases/types";

/**
 * The lines of a successful POST /api/translations, in the order they can arrive. `detected` and
 * `translation` are early looks at an answer still being written; `done` carries the stored group (sent once
 * it is saved) and ends the stream, or `error` does: `translation_failed` when the answer could not be completed
 * after it had started, `save_failed` when it was complete but could not be stored.
 */
export type TranslationEvent =
  | { type: "detected"; lang: Lang }
  | { type: "translation"; lang: Lang; text: string }
  | { type: "done"; group: PhraseGroupDTO }
  | { type: "error"; error: "translation_failed" | "save_failed" };
