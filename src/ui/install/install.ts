"use client";

import { useSyncExternalStore } from "react";
import {
  detectPlatform,
  isInAppBrowser,
  isStandalone,
  type Platform,
} from "./environment";

/** Chrome and Edge's install prompt, which Safari and Firefox do not have. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * How the user can install parlo from here:
 * - "prompt": the browser gave us its own install dialog (Android and desktop Chrome or Edge).
 * - "ios": no dialog exists, but Share, then Add to Home Screen, does.
 * - "in-app": an app's built-in browser, which has to be left first.
 * - null: already installed, or a browser that cannot install it.
 */
export type InstallKind = "prompt" | "ios" | "in-app" | null;

interface Snapshot {
  kind: InstallKind;
  platform: Platform;
}

let deferred: BeforeInstallPromptEvent | null = null;
let cached: Snapshot = { kind: null, platform: "desktop" };
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function compute(): Snapshot {
  const ua = navigator.userAgent;
  const platform = detectPlatform(
    ua,
    navigator.platform,
    navigator.maxTouchPoints,
  );
  let kind: InstallKind = null;
  if (!isStandalone()) {
    if (deferred) kind = "prompt";
    else if (platform === "ios") kind = isInAppBrowser(ua) ? "in-app" : "ios";
    else if (isInAppBrowser(ua)) kind = "in-app";
  }
  return { kind, platform };
}

function getSnapshot(): Snapshot {
  const next = compute();
  // useSyncExternalStore needs the same object back while nothing changed.
  if (next.kind !== cached.kind || next.platform !== cached.platform)
    cached = next;
  return cached;
}

const SERVER: Snapshot = { kind: null, platform: "desktop" };

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The browser fires this once, early, so it is caught here at import time rather than when a component mounts.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Without this Chrome shows its own mini bar; we offer the install from our own button instead.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

/** Test helper: forget a captured install prompt. */
export function resetInstallForTests() {
  deferred = null;
  cached = { kind: null, platform: "desktop" };
}

export function useInstall(): {
  kind: InstallKind;
  platform: Platform;
  /** Shows the browser's install dialog. Only does something when `kind` is "prompt". */
  promptInstall: () => Promise<void>;
} {
  const { kind, platform } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER,
  );
  async function promptInstall() {
    const event = deferred;
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    // The event can be used once, whatever the answer.
    deferred = null;
    notify();
  }
  return { kind, platform, promptInstall };
}
