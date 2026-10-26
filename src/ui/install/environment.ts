export type Platform = "ios" | "android" | "desktop";

/** iPhone, iPad (iPadOS reports itself as a Mac, with a touch screen), Android or anything else. */
export function detectPlatform(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): Platform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (
    /Macintosh|MacIntel/i.test(`${userAgent} ${platform}`) &&
    maxTouchPoints > 1
  )
    return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

/**
 * Chat and social apps open links in their own web view, where "Add to Home Screen" is not offered. A real browser
 * on iOS has "Safari" in its user agent (Chrome, Firefox and Edge add their own token next to it); the web views
 * built into apps usually do not, and many also name themselves. WhatsApp opens a Safari view that looks the same
 * as Safari, so it cannot be told apart.
 */
export function isInAppBrowser(userAgent: string): boolean {
  if (
    /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter|Snapchat|LinkedInApp/i.test(
      userAgent,
    )
  )
    return true;
  return /iPhone|iPad|iPod/i.test(userAgent) && !/Safari\//i.test(userAgent);
}

/** Running as the installed app: Chrome and modern Safari report the display mode, older iOS only `standalone`. */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}
