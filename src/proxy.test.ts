import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

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

  it("redirects the landing route itself to /sign-in when signed out", () => {
    const response = proxy(request("/welcome"));
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in",
    );
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
});
