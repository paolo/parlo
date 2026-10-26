import { describe, expect, it } from "vitest";
import { detectPlatform, isInAppBrowser } from "./environment";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1";
const IPHONE_WEBVIEW =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPHONE_INSTAGRAM = `${IPHONE_WEBVIEW} Instagram 350.0`;
const IPAD_AS_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

describe("detectPlatform", () => {
  it("recognizes iPhones", () => {
    expect(detectPlatform(IPHONE_SAFARI, "iPhone", 5)).toBe("ios");
  });

  it("recognizes an iPad that presents itself as a Mac, by its touch screen", () => {
    expect(detectPlatform(IPAD_AS_MAC, "MacIntel", 5)).toBe("ios");
  });

  it("does not take a real Mac for an iPad", () => {
    expect(detectPlatform(IPAD_AS_MAC, "MacIntel", 0)).toBe("desktop");
  });

  it("recognizes Android", () => {
    expect(detectPlatform(ANDROID_CHROME, "Linux armv81", 5)).toBe("android");
  });
});

describe("isInAppBrowser", () => {
  it("treats Safari and other iOS browsers as real browsers", () => {
    expect(isInAppBrowser(IPHONE_SAFARI)).toBe(false);
    expect(isInAppBrowser(IPHONE_CHROME)).toBe(false);
  });

  it("spots an iOS web view without the Safari token, and named social apps", () => {
    expect(isInAppBrowser(IPHONE_WEBVIEW)).toBe(true);
    expect(isInAppBrowser(IPHONE_INSTAGRAM)).toBe(true);
  });

  it("does not flag Android Chrome", () => {
    expect(isInAppBrowser(ANDROID_CHROME)).toBe(false);
  });
});
