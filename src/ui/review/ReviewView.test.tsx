import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { ReviewView } from "./ReviewView";

const keepOrder = () => 0.999999;

const profile = [
  { lang: "es", region: "BO", level: "native", position: 0 },
  { lang: "en", region: "GB", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

const card = (id: string, es: string, en: string, fr: string): PhraseGroupDTO =>
  makeGroup({
    id,
    isFavorite: true,
    phrases: [
      { lang: "es", text: es, isRoot: true, correctedFrom: null },
      { lang: "en", text: en, isRoot: false, correctedFrom: null },
      { lang: "fr", text: fr, isRoot: false, correctedFrom: null },
    ],
  });
const a = card("a", "Uno", "One", "Un");
const b = card("b", "Dos", "Two", "Deux");

const PREFS_KEY = "parlo.practice";
const remember = (prefs: object) =>
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));

/** Answers the profile, favorites with `groups` and history with `history`. */
function mockApi(groups: PhraseGroupDTO[], history: PhraseGroupDTO[] = groups) {
  const api = vi.fn(async (url: string) =>
    url === "/api/profile"
      ? Response.json({ languages: profile })
      : Response.json({
          items: url.includes("favorite=false") ? history : groups,
          nextCursor: null,
          limit: 100,
        }),
  );
  vi.stubGlobal("fetch", api);
  return api;
}

const click = (name: string | RegExp) =>
  userEvent.click(screen.getByRole("button", { name }));

/** Presses Start on the setup screen once it has loaded. */
async function start() {
  await userEvent.click(
    await screen.findByRole("button", { name: /^start$/i }),
  );
}
/** Picks the radio whose name starts with `name` ("Favorites" also matches "Favorites 6"). */
const pickRadio = async (group: string, name: string) =>
  userEvent.click(
    within(await screen.findByRole("radiogroup", { name: group })).getByRole(
      "radio",
      { name: new RegExp(`^${name}`) },
    ),
  );
const many = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    card(`m${i}`, `es${i}`, `en${i}`, `fr${i}`),
  );

/** Opens a language pill ("Practice in" or "Type in") and picks a language from its list. */
async function pickLanguage(label: string, language: RegExp) {
  await userEvent.click(
    await screen.findByRole("button", { name: new RegExp(`^${label}:`) }),
  );
  await userEvent.click(
    await screen.findByRole("menuitem", { name: language }),
  );
}

describe("ReviewView", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Most tests practice the favorites they mock, 20 at a time.
    remember({ source: "favorites", count: 20 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("starts in the second language and hides the other versions until Reveal", async () => {
    mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();

    expect(await screen.findByText("One")).toBeInTheDocument();
    expect(screen.queryByText("Uno")).not.toBeInTheDocument();
    expect(screen.queryByText("Un")).not.toBeInTheDocument();

    await click("Reveal");

    expect(screen.getByText("Uno")).toBeInTheDocument();
    expect(screen.getByText("Un")).toBeInTheDocument();
  });

  it("advances on Got it and updates the progress", async () => {
    mockApi([a, b]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();
    await screen.findByText("One");
    expect(screen.getByText("0 of 2")).toBeInTheDocument();

    await click("Reveal");
    await click("Got it");

    expect(await screen.findByText("Two")).toBeInTheDocument();
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.queryByText("Uno")).not.toBeInTheDocument();
  });

  it("shows an Again card once more, then ends in a summary that can restart", async () => {
    mockApi([a, b]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();
    await screen.findByText("One");

    await click("Reveal");
    await click("Again");
    expect(await screen.findByText("Two")).toBeInTheDocument();
    await click("Reveal");
    await click("Got it");
    expect(await screen.findByText("One")).toBeInTheDocument();
    await click("Reveal");
    await click("Got it");

    expect(
      await screen.findByText("1 of 2 right on the first try"),
    ).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back to phrasebook" }),
    ).not.toBeInTheDocument();

    await click("Practice again");

    expect(await screen.findByText("0 of 2")).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
  });

  it("practices in the language picked on the setup screen", async () => {
    mockApi([a, b]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await pickLanguage("Practice in", /Français/);
    await start();

    expect(await screen.findByText("Un")).toBeInTheDocument();
    expect(screen.getByText("0 of 2")).toBeInTheDocument();
  });

  it("skips and counts groups without the practice language", async () => {
    const noEnglish = makeGroup({
      id: "old",
      phrases: [
        { lang: "es", text: "Hola", isRoot: true, correctedFrom: null },
        { lang: "fr", text: "Salut", isRoot: false, correctedFrom: null },
      ],
    });
    mockApi([a, noEnglish]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();

    expect(await screen.findByText("One")).toBeInTheDocument();
    expect(
      screen.getByText("1 phrase skipped: no English version"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 1")).toBeInTheDocument();
  });

  it("swaps the practice and typing languages with one tap", async () => {
    mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await pickRadio("How to practice", "Type");
    expect(
      screen.getByRole("button", { name: "Practice in: English" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Type in: Español" }),
    ).toBeInTheDocument();

    await click("Swap languages");

    expect(
      screen.getByRole("button", { name: "Practice in: Español" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Type in: English" }),
    ).toBeInTheDocument();
    await start();
    expect(await screen.findByText("Uno")).toBeInTheDocument();
  });

  it("explains that practice uses favorite phrases when there are none", async () => {
    mockApi([]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await pickRadio("Where cards come from", "Favorites");
    await start();

    expect(await screen.findByText("Your deck is empty")).toBeInTheDocument();
    expect(
      screen.getByText(/practice uses your favorite phrases/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Practice in:/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /translate/i })).toHaveAttribute(
      "href",
      "/",
    );
    // A way forward in place: Starter always has cards.
    await click("Use Starter");
    expect(await screen.findByText("0 of 20")).toBeInTheDocument();
  });

  it("only ever reads the profile and phrase lists, never translating", async () => {
    const api = mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await start();
    await screen.findByText("One");
    await click("Reveal");
    await click("Got it");

    const urls = api.mock.calls.map(([url]) => url);
    expect(new Set(urls)).toEqual(
      new Set([
        "/api/profile",
        "/api/phrase-groups?favorite=true&limit=100",
        "/api/phrase-groups?favorite=false&limit=100",
      ]),
    );
  });

  describe("setup", () => {
    it("opens on Starter with 10 cards on a first visit", async () => {
      window.localStorage.clear();
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: /^Starter/ })).toBeChecked();
      expect(screen.getByRole("radio", { name: "10" })).toBeChecked();
      expect(screen.queryByText("One")).not.toBeInTheDocument();
    });

    it("remembers the last source and count", async () => {
      remember({ source: "recent", count: 20 });
      mockApi([a], many(25));
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: /^Recent/ })).toBeChecked();
      expect(screen.getByRole("radio", { name: "20" })).toBeChecked();
    });

    it("saves the choice when practice starts", async () => {
      mockApi(many(7));
      renderWithProviders(<ReviewView random={keepOrder} />);
      await pickRadio("Cards this round", "5");
      await start();

      expect(JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? "")).toEqual({
        source: "favorites",
        count: 5,
      });
    });

    it("falls back to Starter when the saved Favorites is empty", async () => {
      mockApi([]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: /^Starter/ })).toBeChecked();
    });

    it("survives unreadable storage", async () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: /^Starter/ })).toBeChecked();
      expect(screen.getByRole("radio", { name: "10" })).toBeChecked();
    });

    it("deals only as many cards as asked", async () => {
      const seven = "abcdefg".split("").map((id) => card(id, id, id, id));
      remember({ source: "favorites", count: 5 });
      mockApi(seven);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(await screen.findByText("0 of 5")).toBeInTheDocument();
    });

    it("deals everything when fewer cards exist than asked", async () => {
      mockApi([a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(await screen.findByText("0 of 2")).toBeInTheDocument();
    });

    it("collapses setup to a summary once started, and Change brings it back", async () => {
      remember({ source: "favorites", count: 5 });
      mockApi(many(7));
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(
        await screen.findByText("Favorites · 5 cards"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^start$/i }),
      ).not.toBeInTheDocument();

      await click("Setup");

      expect(
        await screen.findByRole("button", { name: /^start$/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText("One")).not.toBeInTheDocument();
    });

    it("deals Recent from history, including what was never favorited", async () => {
      remember({ source: "recent", count: 10 });
      const api = mockApi([], [a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(await screen.findByText("0 of 2")).toBeInTheDocument();
      expect(
        api.mock.calls.some(
          ([url]) => url === "/api/phrase-groups?favorite=false&limit=100",
        ),
      ).toBe(true);
    });

    it("says how many phrases the chosen source has", async () => {
      mockApi([a, b], [a, b, card("c", "Tres", "Three", "Trois")]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      expect(await screen.findByText("2 phrases")).toBeInTheDocument();
      await pickRadio("Where cards come from", "Recent");
      expect(screen.getByText("3 phrases")).toBeInTheDocument();
      await pickRadio("Where cards come from", "Starter");
      expect(await screen.findByText("100 phrases")).toBeInTheDocument();
    });

    it("disables counts bigger than the source and uses the biggest that fits", async () => {
      mockApi(many(6));
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: "5" })).toBeEnabled();
      expect(screen.getByRole("radio", { name: "10" })).toBeDisabled();
      expect(screen.getByRole("radio", { name: "20" })).toBeDisabled();
      // The remembered 20 is more than the 6 favorites, so 5 is what is selected.
      expect(screen.getByRole("radio", { name: "5" })).toBeChecked();
      await start();
      expect(await screen.findByText("0 of 5")).toBeInTheDocument();
    });

    it("deals everything a tiny source has, with the smallest count selected", async () => {
      mockApi(many(3));
      renderWithProviders(<ReviewView random={keepOrder} />);

      await screen.findByRole("button", { name: /^start$/i });
      expect(screen.getByRole("radio", { name: "5" })).toBeChecked();
      await start();
      expect(await screen.findByText("0 of 3")).toBeInTheDocument();
      expect(screen.getByText("Favorites · 3 cards")).toBeInTheDocument();
    });

    it("shows a Starter card's other versions only in the languages the user has", async () => {
      remember({ source: "starter", count: 5 });
      mockApi([]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await screen.findByRole("radio", { name: "Starter" });
      await start();

      await screen.findByText("Hi, how are you?");
      await click("Reveal");

      expect(screen.getByText("Hola, ¿cómo estás?")).toBeInTheDocument();
      expect(screen.getByText("Salut, comment ça va ?")).toBeInTheDocument();
      expect(screen.queryByText("Привіт, як справи?")).not.toBeInTheDocument();
      expect(screen.queryByText("Kumusta ka?")).not.toBeInTheDocument();
    });

    it("shows speaking as on its way, not selectable", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);

      const speak = await screen.findByRole("radio", { name: /^Say it/ });
      expect(speak).toBeDisabled();
      expect(screen.getByText("Soon")).toBeInTheDocument();
    });

    it("offers Starter when Recent fails to load", async () => {
      remember({ source: "recent", count: 10 });
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url === "/api/profile"
            ? Response.json({ languages: profile })
            : url.includes("favorite=false")
              ? Response.json({ error: "boom" }, { status: 500 })
              : Response.json({ items: [a], nextCursor: null, limit: 100 }),
        ),
      );
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      expect(
        await screen.findByText(/couldn't load these phrases/i),
      ).toBeInTheDocument();
      await click("Use Starter");
      expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    });

    it("shows Starter cards in Arabic as Arabic, directed by the text", async () => {
      window.localStorage.clear();
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url === "/api/profile"
            ? Response.json({
                languages: [
                  { lang: "en", region: "CA", level: "native", position: 0 },
                  {
                    lang: "ar",
                    region: "EG",
                    level: "intermediate",
                    position: 1,
                  },
                  {
                    lang: "fa",
                    region: "IR",
                    level: "intermediate",
                    position: 2,
                  },
                ],
              })
            : Response.json({ items: [], nextCursor: null, limit: 100 }),
        ),
      );
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();

      await screen.findByText("0 of 10");
      expect(document.querySelector('[lang="ar"][dir="auto"]')).not.toBeNull();
    });

    it("deals a fresh draw from the same source on Practice again", async () => {
      remember({ source: "favorites", count: 5 });
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await start();
      await screen.findByText("One");
      await click("Reveal");
      await click("Got it");
      await click("Practice again");

      expect(await screen.findByText("0 of 1")).toBeInTheDocument();
      expect(screen.getByText("Favorites · 1 card")).toBeInTheDocument();
    });
  });

  describe("favoriting from the card", () => {
    /** A small server: lists favorites and history, and applies the star, PATCH and bundle calls. */
    function fakeServer(
      favorites: PhraseGroupDTO[],
      recent: PhraseGroupDTO[] = [],
    ) {
      const state = { favorites: [...favorites], recent: [...recent] };
      const api = vi.fn(async (url: string, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        if (url === "/api/profile")
          return Response.json({ languages: profile });
        if (method === "GET") {
          const items = url.includes("favorite=false")
            ? state.recent
            : state.favorites;
          return Response.json({ items, nextCursor: null, limit: 100 });
        }
        const bundle = url.match(/^\/api\/bundle-favorites\/([^/]+)\/([^/]+)$/);
        if (bundle) {
          const ref = `${bundle[1]}:${bundle[2]}`;
          if (method === "PUT") {
            if (!state.favorites.some((g) => g.bundleRef === ref)) {
              state.favorites.push(
                makeGroup({
                  id: `saved-${ref}`,
                  isFavorite: true,
                  bundleRef: ref,
                }),
              );
            }
            return Response.json({ group: state.favorites.at(-1) });
          }
          state.favorites = state.favorites.filter((g) => g.bundleRef !== ref);
          return new Response(null, { status: 204 });
        }
        const id = url.split("/").pop();
        const { isFavorite } = JSON.parse(String(init?.body));
        const group = [...state.favorites, ...state.recent].find(
          (g) => g.id === id,
        );
        state.favorites = state.favorites.filter((g) => g.id !== id);
        if (isFavorite && group) state.favorites.push({ ...group, isFavorite });
        return Response.json({ group: { ...group, isFavorite } });
      });
      vi.stubGlobal("fetch", api);
      return api;
    }
    const sent = (api: ReturnType<typeof vi.fn>, method: string) =>
      api.mock.calls.filter(([, init]) => init?.method === method);

    it("saves a Starter phrase the first time it is starred, and removes it when un-starred", async () => {
      remember({ source: "starter", count: 5 });
      const api = fakeServer([]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await screen.findByRole("radio", { name: "Starter" });
      await start();
      await screen.findByText("Hi, how are you?");

      await click("Add to favorites");

      expect(
        await screen.findByRole("button", { name: "Remove from favorites" }),
      ).toBeInTheDocument();
      expect(sent(api, "PUT")[0][0]).toBe(
        "/api/bundle-favorites/starter/starter-001",
      );

      await click("Remove from favorites");

      expect(
        await screen.findByRole("button", { name: "Add to favorites" }),
      ).toBeInTheDocument();
      expect(sent(api, "DELETE")[0][0]).toBe(
        "/api/bundle-favorites/starter/starter-001",
      );
    });

    it("shows a Starter phrase the user already saved as a favorite", async () => {
      remember({ source: "starter", count: 5 });
      fakeServer([
        makeGroup({
          id: "saved",
          isFavorite: true,
          bundleRef: "starter:starter-001",
        }),
      ]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await screen.findByRole("radio", { name: "Starter" });
      await start();
      await screen.findByText("Hi, how are you?");

      expect(
        await screen.findByRole("button", { name: "Remove from favorites" }),
      ).toBeInTheDocument();
    });

    it("favorites a Recent card through the phrase group", async () => {
      remember({ source: "recent", count: 5 });
      const api = fakeServer([], [a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await screen.findByRole("radio", { name: "Recent" });
      await start();
      await screen.findByText("One");

      await click("Add to favorites");

      expect(
        await screen.findByRole("button", { name: "Remove from favorites" }),
      ).toBeInTheDocument();
      const [url, init] = sent(api, "PATCH")[0];
      expect(url).toBe("/api/phrase-groups/a");
      expect(JSON.parse(init.body)).toEqual({ isFavorite: true });
    });

    it("leaves the round alone when a card is un-starred, and shows it un-starred if it comes back", async () => {
      remember({ source: "favorites", count: 5 });
      fakeServer([a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await screen.findByRole("button", { name: /^start$/i });
      await start();
      await screen.findByText("One");

      await click("Remove from favorites");
      await screen.findByRole("button", { name: "Add to favorites" });

      // Still the same round: same size, same summary, and the next card is the next one dealt.
      expect(screen.getByText("0 of 2")).toBeInTheDocument();
      expect(screen.getByText("Favorites · 2 cards")).toBeInTheDocument();
      await click("Reveal");
      await click("Again");
      expect(await screen.findByText("Two")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Remove from favorites" }),
      ).toBeInTheDocument();
      await click("Reveal");
      await click("Got it");
      // "One" returns after the Again, with its star as the user left it.
      expect(await screen.findByText("One")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add to favorites" }),
      ).toBeInTheDocument();
    });

    it("deals Practice again from the favorites as they are now", async () => {
      remember({ source: "favorites", count: 5 });
      fakeServer([a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await screen.findByRole("button", { name: /^start$/i });
      await start();
      await screen.findByText("One");
      await click("Remove from favorites");
      await screen.findByRole("button", { name: "Add to favorites" });
      await click("Reveal");
      await click("Got it");
      await screen.findByText("Two");
      await click("Reveal");
      await click("Got it");

      await click("Practice again");

      expect(await screen.findByText("0 of 1")).toBeInTheDocument();
      expect(screen.getByText("Two")).toBeInTheDocument();
    });

    it("keeps the star as it was when saving fails", async () => {
      remember({ source: "starter", count: 5 });
      const api = fakeServer([]);
      const ok = api.getMockImplementation() as (
        url: string,
        init?: RequestInit,
      ) => Promise<Response>;
      api.mockImplementation(async (url, init) =>
        init?.method === "PUT"
          ? Response.json(
              { error: "phrasebook_full", limit: 100 },
              { status: 409 },
            )
          : ok(url, init),
      );
      renderWithProviders(<ReviewView random={keepOrder} />);
      await screen.findByRole("radio", { name: "Starter" });
      await start();
      await screen.findByText("Hi, how are you?");

      await click("Add to favorites");

      await waitFor(() => expect(sent(api, "PUT")).toHaveLength(1));
      expect(
        await screen.findByRole("button", { name: "Add to favorites" }),
      ).toBeEnabled();
    });
  });

  describe("typing", () => {
    const group = (name: string) => screen.getByRole("radiogroup", { name });
    async function startTyping(before?: () => Promise<void>) {
      await screen.findByRole("radiogroup", { name: "How to practice" });
      await userEvent.click(
        within(group("How to practice")).getByRole("radio", { name: /^Type/ }),
      );
      await before?.();
      await start();
    }
    const typeAnswer = async (text: string) => {
      await userEvent.type(screen.getByRole("textbox"), text);
      await click("Check");
    };

    it("asks for the native phrase by default instead of offering Reveal", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      expect(screen.getByText("One")).toBeInTheDocument();
      expect(screen.getByText("Write it in Español")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Reveal" }),
      ).not.toBeInTheDocument();
    });

    it("counts a correct answer and moves on", async () => {
      mockApi([a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await typeAnswer("uno");
      expect(await screen.findByText("Correct")).toBeInTheDocument();
      await click("Next");

      expect(await screen.findByText("Two")).toBeInTheDocument();
      expect(screen.getByText("1 of 2")).toBeInTheDocument();
    });

    it("calls a missing accent almost, shows the right phrase and lets you count it", async () => {
      mockApi([card("q", "Qué tal", "How are you", "Ça va")]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await typeAnswer("que tal");

      expect(await screen.findByText("Almost")).toBeInTheDocument();
      expect(screen.getByText("Qué tal")).toBeInTheDocument();
      expect(screen.getByText("que tal")).toBeInTheDocument();
      await click("Count it");
      expect(
        await screen.findByText("1 of 1 right on the first try"),
      ).toBeInTheDocument();
    });

    it("on a wrong answer shows the phrase, and Again brings the card back", async () => {
      mockApi([a, b]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await typeAnswer("cero");
      expect(await screen.findByText("Not quite")).toBeInTheDocument();
      expect(screen.getByText("Uno")).toBeInTheDocument();
      await click("Again");

      expect(await screen.findByText("Two")).toBeInTheDocument();
      expect(screen.getByText("0 of 2")).toBeInTheDocument();
    });

    it("lets you overrule a wrong answer with I was right", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await typeAnswer("el uno");
      await click("I was right");

      expect(
        await screen.findByText("1 of 1 right on the first try"),
      ).toBeInTheDocument();
    });

    it("does not check an empty answer", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping();

      await click("Check");

      expect(screen.queryByText("Not quite")).not.toBeInTheDocument();
      expect(screen.getByText("Write it in Español")).toBeInTheDocument();
    });

    it("types in the chosen language, and the answer language never matches the start", async () => {
      mockApi([a]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping(() => pickLanguage("Type in", /Français/));

      expect(screen.getByText("Write it in Français")).toBeInTheDocument();
      await typeAnswer("un");
      expect(await screen.findByText("Correct")).toBeInTheDocument();

      await click("Setup");
      await pickLanguage("Practice in", /Español/);
      // Starting from Español leaves English and Français to type in.
      await userEvent.click(screen.getByRole("button", { name: /^Type in:/ }));
      expect(
        screen.queryByRole("menuitem", { name: /Español/ }),
      ).not.toBeInTheDocument();
      expect(
        await screen.findByRole("menuitem", { name: /English/ }),
      ).toBeInTheDocument();
    });

    it("skips groups missing the answer language and says so", async () => {
      const noFrench = makeGroup({
        id: "nf",
        phrases: [
          { lang: "es", text: "Hola", isRoot: true, correctedFrom: null },
          { lang: "en", text: "Hello", isRoot: false, correctedFrom: null },
        ],
      });
      mockApi([a, noFrench]);
      renderWithProviders(<ReviewView random={keepOrder} />);
      await startTyping(() => pickLanguage("Type in", /Français/));

      expect(
        await screen.findByText(
          "1 phrase skipped: no English or French version",
        ),
      ).toBeInTheDocument();
    });
  });
});
