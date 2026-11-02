import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { TranslationEvent } from "@/server/translation/events";
import type { Lang } from "../shared/languages";
import { ApiError } from "./api";

/** What has arrived of a translation that is still being written. */
export interface TranslationProgress {
  detected?: Lang;
  translations: { lang: Lang; text: string }[];
}

export const NO_PROGRESS: TranslationProgress = { translations: [] };

/**
 * POSTs the phrase and reads the answer line by line, calling `onProgress` as the language and each
 * translation arrive. Resolves with the stored group; throws an ApiError like apiFetch does, whether the
 * request was refused up front (limit, language, profile) or the answer broke off after it had started.
 */
export async function streamTranslation(
  text: string,
  onProgress: (progress: TranslationProgress) => void,
): Promise<{ group: PhraseGroupDTO }> {
  const res = await fetch("/api/translations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok || !res.body) {
    throw new ApiError(res.status, await res.json().catch(() => null));
  }

  let progress = NO_PROGRESS;
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffered = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += value;
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";
    for (const line of lines) {
      if (!line) continue;
      const event = JSON.parse(line) as TranslationEvent;
      if (event.type === "done") return { group: event.group };
      if (event.type === "error") {
        throw new ApiError(502, { error: event.error });
      }
      progress =
        event.type === "detected"
          ? { ...progress, detected: event.lang }
          : {
              ...progress,
              translations: [
                ...progress.translations,
                { lang: event.lang, text: event.text },
              ],
            };
      onProgress(progress);
    }
  }
  // The stream ended without its last line: the connection dropped or the server stopped mid-answer.
  throw new ApiError(502, { error: "translation_failed" });
}
