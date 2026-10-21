import { useSyncExternalStore } from "react";

function detectMac(): boolean {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return /mac/i.test(nav.userAgentData?.platform ?? nav.platform);
}

const subscribe = () => () => {};

/** True on macOS; false on the server and during hydration, so server and client markup agree. */
export function useIsMac(): boolean {
  return useSyncExternalStore(subscribe, detectMac, () => false);
}
