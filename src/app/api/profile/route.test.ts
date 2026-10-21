import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";

const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getSession }));
const repository = vi.hoisted(() => ({
  getProfile: vi.fn(),
  replaceProfile: vi.fn(),
}));
vi.mock("@/server/container", () => ({
  getProfileRepository: () => repository,
}));

const ctx = { params: Promise.resolve({}) };
const get = () => GET(new Request("http://test/api/profile"), ctx);
const put = (body: unknown) =>
  PUT(
    new Request("http://test/api/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
    ctx,
  );

describe("/api/profile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getSession.mockResolvedValue({ userId: "u1" });
  });

  it("requires a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    expect((await put({})).status).toBe(401);
  });

  it("returns an empty list when the user has no profile", async () => {
    repository.getProfile.mockResolvedValue([]);
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ languages: [] });
  });

  it("saves a valid profile, filling default regions and levels", async () => {
    const res = await put({
      languages: [{ lang: "es", region: "BO" }, { lang: "en" }, { lang: "fr" }],
    });

    expect(res.status).toBe(200);
    const { languages } = await res.json();
    expect(languages).toEqual([
      { lang: "es", region: "BO", level: "native", position: 0 },
      { lang: "en", region: "GB", level: "intermediate", position: 1 },
      { lang: "fr", region: "FR", level: "intermediate", position: 2 },
    ]);
    expect(repository.replaceProfile).toHaveBeenCalledOnce();
    expect(repository.replaceProfile).toHaveBeenCalledWith("u1", languages);
  });

  it.each([
    ["two entries", [{ lang: "es" }, { lang: "en" }]],
    [
      "four entries",
      [{ lang: "es" }, { lang: "en" }, { lang: "fr" }, { lang: "pt" }],
    ],
    ["a duplicate language", [{ lang: "es" }, { lang: "en" }, { lang: "en" }]],
    ["an unknown language", [{ lang: "es" }, { lang: "en" }, { lang: "xx" }]],
    [
      "a region from another language",
      [{ lang: "pt", region: "BO" }, { lang: "en" }, { lang: "fr" }],
    ],
  ])("rejects %s without saving", async (_name, languages) => {
    const res = await put({ languages });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "invalid_input" });
    expect(repository.replaceProfile).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    const res = await PUT(
      new Request("http://test/api/profile", { method: "PUT", body: "nope" }),
      ctx,
    );
    expect(res.status).toBe(400);
  });
});
