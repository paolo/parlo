import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

const SESSION_COOKIE = "better-auth.session_token=abc";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

describe("proxy", () => {
  it("rewrites / to the landing page when signed out, keeping the URL", () => {
    const response = proxy(request("/"));
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/welcome",
    );
    expect(response.status).toBe(200);
  });

  it("redirects other paths to /sign-in when signed out", () => {
    const response = proxy(request("/phrasebook"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in",
    );
  });

  it("redirects /welcome to / when signed out, so the rewrite target is not a page of its own", () => {
    const response = proxy(request("/welcome"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects /welcome to / when signed in too", () => {
    const response = proxy(request("/welcome", SESSION_COOKIE));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("lets a signed-in visitor through to the app at /", () => {
    const response = proxy(request("/", SESSION_COOKIE));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("lets a signed-in visitor through on other paths", () => {
    const response = proxy(request("/phrasebook", SESSION_COOKIE));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  // Link crawlers are signed out; if the proxy caught the preview image they would get a redirect, not a picture.
  describe("matcher", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);

    it.each([
      "/welcome/opengraph-image",
      "/opengraph-image",
      "/sign-in",
      "/api/phrases",
    ])("leaves %s alone", (path) => {
      expect(matcher.test(path)).toBe(false);
    });

    it.each([
      "/",
      "/welcome",
      "/phrasebook",
      "/history",
    ])("guards %s", (path) => {
      expect(matcher.test(path)).toBe(true);
    });
  });
});
