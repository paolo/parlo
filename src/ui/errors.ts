import { LANGUAGES, type Lang } from "../shared/languages";
import { ApiError } from "./api";

/** Turns any failure from our API into a sentence for a notification. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const code = error.body?.error;
    if (code === "rate_limited") {
      const resetAt = new Date(String(error.body?.resetAt));
      if (error.body?.reason === "daily") {
        const time = resetAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `You've reached today's daily limit. It resets at ${time}.`;
      }
      const seconds = Math.max(
        1,
        Math.ceil((resetAt.getTime() - Date.now()) / 1000),
      );
      return `Slow down a little. Try again in ${seconds} s.`;
    }
    if (code === "unsupported_language") {
      const names = Array.isArray(error.body?.languages)
        ? (error.body.languages as Lang[]).map((l) => LANGUAGES[l].endonym)
        : [];
      return names.length > 0
        ? `Parlo understands ${names.join(", ")}. Try a phrase in one of those.`
        : "Parlo doesn't recognise that language. Try one of your own languages.";
    }
    if (code === "phrasebook_full")
      return `Your phrasebook is full (${error.body?.limit}). Remove one to add another.`;
    if (code === "already_accepted")
      return "That correction was already applied.";
    if (code === "no_correction") return "There is no correction to apply.";
    if (code === "profile_incomplete")
      return "Pick your three languages first.";
    if (code === "translation_failed")
      return "The translation didn't come through. Please try again.";
    if (error.status === 401)
      return "Your session expired. Please sign in again.";
  }
  return "Something went wrong. Please try again.";
}
