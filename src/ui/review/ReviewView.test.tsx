import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

function mockApi(groups: PhraseGroupDTO[]) {
  const api = vi.fn(async (url: string) =>
    url === "/api/profile"
      ? Response.json({ languages: profile })
      : Response.json({ items: groups, nextCursor: null, limit: 100 }),
  );
  vi.stubGlobal("fetch", api);
  return api;
}

const click = (name: string | RegExp) =>
  userEvent.click(screen.getByRole("button", { name }));

/** Opens a language pill ("Practice in" or "Type in") and picks a language from its list. */
async function pickLanguage(label: string, language: RegExp) {
  await userEvent.click(
    screen.getByRole("button", { name: new RegExp(`^${label}:`) }),
  );
  await userEvent.click(
    await screen.findByRole("menuitem", { name: language }),
  );
}

describe("ReviewView", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts in the second language and hides the other versions until Reveal", async () => {
    mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);

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
      screen.getByRole("link", { name: "Back to phrasebook" }),
    ).toHaveAttribute("href", "/phrasebook");

    await click("Practice again");

    expect(await screen.findByText("0 of 2")).toBeInTheDocument();
    expect(screen.getByText("One")).toBeInTheDocument();
  });

  it("restarts in the chosen practice language", async () => {
    mockApi([a, b]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await screen.findByText("One");
    await click("Reveal");
    await click("Got it");

    await pickLanguage("Practice in", /Français/);

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

    expect(await screen.findByText("One")).toBeInTheDocument();
    expect(
      screen.getByText("1 phrase skipped: no English version"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 1")).toBeInTheDocument();
  });

  it("says the deck is the starred phrases, and that a small one can grow", async () => {
    mockApi([a, b]);
    renderWithProviders(<ReviewView random={keepOrder} />);

    expect(await screen.findByText("2 starred phrases")).toBeInTheDocument();
    expect(screen.getByText(/small deck so far/i)).toBeInTheDocument();
  });

  it("swaps the practice and typing languages with one tap", async () => {
    mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await screen.findByText("One");
    await userEvent.click(screen.getByRole("radio", { name: "Type" }));
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
    expect(await screen.findByText("Uno")).toBeInTheDocument();
  });

  it("drops the small-deck hint once there are enough phrases", async () => {
    const many = ["a", "b", "c", "d", "e"].map((id) =>
      card(id, `es ${id}`, `en ${id}`, `fr ${id}`),
    );
    mockApi(many);
    renderWithProviders(<ReviewView random={keepOrder} />);

    expect(await screen.findByText("5 starred phrases")).toBeInTheDocument();
    expect(screen.queryByText(/small deck so far/i)).not.toBeInTheDocument();
  });

  it("explains that practice uses starred phrases when there are none", async () => {
    mockApi([]);
    renderWithProviders(<ReviewView random={keepOrder} />);

    expect(await screen.findByText("Your deck is empty")).toBeInTheDocument();
    expect(
      screen.getByText(/practice uses the phrases you star/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Practice in:/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /translate/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("only ever reads the profile and the favorites", async () => {
    const api = mockApi([a]);
    renderWithProviders(<ReviewView random={keepOrder} />);
    await screen.findByText("One");
    await click("Reveal");
    await click("Got it");

    const urls = api.mock.calls.map(([url]) => url);
    expect(new Set(urls)).toEqual(
      new Set(["/api/profile", "/api/phrase-groups?favorite=true&limit=100"]),
    );
  });

  describe("typing", () => {
    const group = (name: string) => screen.getByRole("radiogroup", { name });
    async function startTyping() {
      await screen.findByRole("radiogroup", { name: "How to practice" });
      await userEvent.click(
        within(group("How to practice")).getByRole("radio", { name: "Type" }),
      );
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
      await startTyping();

      await pickLanguage("Type in", /Français/);
      expect(screen.getByText("Write it in Français")).toBeInTheDocument();
      await typeAnswer("un");
      expect(await screen.findByText("Correct")).toBeInTheDocument();

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
      await startTyping();
      await pickLanguage("Type in", /Français/);

      expect(
        await screen.findByText(
          "1 phrase skipped: no English or French version",
        ),
      ).toBeInTheDocument();
    });
  });
});
