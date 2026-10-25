import { screen } from "@testing-library/react";
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

    await userEvent.click(screen.getByRole("radio", { name: /Français/ }));

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

    expect(
      await screen.findByText("Your deck: 2 starred phrases"),
    ).toBeInTheDocument();
    expect(screen.getByText(/small deck so far/i)).toBeInTheDocument();
  });

  it("drops the small-deck hint once there are enough phrases", async () => {
    const many = ["a", "b", "c", "d", "e"].map((id) =>
      card(id, `es ${id}`, `en ${id}`, `fr ${id}`),
    );
    mockApi(many);
    renderWithProviders(<ReviewView random={keepOrder} />);

    expect(
      await screen.findByText("Your deck: 5 starred phrases"),
    ).toBeInTheDocument();
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
      screen.queryByRole("radiogroup", { name: "Practice in" }),
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
});
