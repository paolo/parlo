"use client";

import { useSyncExternalStore } from "react";
import { type InstallKind, useInstall } from "./install";

const KEY = "parlo.install";
/** Translations before the banner appears: the user has seen what parlo does. */
export const NUDGE_AFTER = 3;
/** How long a dismissed banner stays away. */
export const NUDGE_PAUSE_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

interface Stored {
  translations: number;
  dismissedAt: number | null;
}

/** Pure decision, so it can be tested without a browser. */
export function shouldNudge(input: {
  kind: InstallKind;
  translations: number;
  dismissedAt: number | null;
  now: number;
}): boolean {
  if (input.kind === null) return false;
  if (input.translations < NUDGE_AFTER) return false;
  if (
    input.dismissedAt !== null &&
    input.now - input.dismissedAt < NUDGE_PAUSE_DAYS * DAY
  )
    return false;
  return true;
}

// localStorage can be missing, full or blocked (private windows): everything here works without it.
function read(): Stored {
  try {
    const raw = window.localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : null;
    return {
      translations:
        typeof value?.translations === "number" ? value.translations : 0,
      dismissedAt:
        typeof value?.dismissedAt === "number" ? value.dismissedAt : null,
    };
  } catch {
    return { translations: 0, dismissedAt: null };
  }
}

const listeners = new Set<() => void>();
let memory: Stored | null = null;

function write(next: Stored) {
  memory = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Kept in memory for this visit.
  }
  for (const listener of listeners) listener();
}

function current(): Stored {
  return memory ?? read();
}

let cachedRaw = "";
let cachedValue: Stored = { translations: 0, dismissedAt: null };
function getSnapshot(): Stored {
  const value = current();
  const raw = JSON.stringify(value);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = value;
  }
  return cachedValue;
}
const SERVER: Stored = { translations: 0, dismissedAt: null };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call after each successful translation. */
export function countTranslation() {
  const { translations, dismissedAt } = current();
  write({ translations: translations + 1, dismissedAt });
}

/** Test helper: forget what was stored. */
export function resetNudgeForTests() {
  memory = null;
  cachedRaw = "";
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}

/** Whether to show the one-time banner, and how to dismiss it for a while. */
export function useInstallNudge(): { show: boolean; dismiss: () => void } {
  const { kind } = useInstall();
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => SERVER);
  return {
    // Date.now() only matters once the translation count is high enough, which is never true on the server.
    show: shouldNudge({ kind, ...stored, now: Date.now() }),
    dismiss: () =>
      write({ translations: stored.translations, dismissedAt: Date.now() }),
  };
}
