import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LANG_CODES, LANGUAGES, regionName } from "../../shared/languages";
import { LandingGame } from "./LandingGame";

const KEY = "parlo.visitor";
const click = (name: string | RegExp) =>
  userEvent.click(screen.getByRole("button", { name }));
const card = (name: RegExp) => screen.findByRole("button", { name });
const natives = LANG_CODES.filter((c) => c !== "en" && c !== "fr");

describe("LandingGame", () => {
  let fetchStub: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    fetchStub = vi.fn(async () => {
      throw new Error("a visitor's round must not call the server");
    });
    vi.stubGlobal("fetch", fetchStub);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("offers a card for each language but English and French, with up to four flags", async () => {
    const { container } = renderWithProviders(<LandingGame />);

    await card(/Español/);
    const main = screen.getAllByRole("list")[0];
    expect(
      within(main)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(
      natives.map((c) => `${LANGUAGES[c].name}${LANGUAGES[c].endonym}`),
    );
    const spanish = (await card(/Español/)).closest("li") as HTMLElement;
    expect(
      [...spanish.querySelectorAll("img")].map((img) =>
        img.getAttribute("src"),
      ),
    ).toEqual([
      "/flags/es.svg",
      "/flags/mx.svg",
      "/flags/co.svg",
      "/flags/bo.svg",
    ]);
    expect(container.querySelector('img[src="/flags/ar.svg"]')).toBeNull();
  });

  it("sets English and French apart as another way in", async () => {
    renderWithProviders(<LandingGame />);
    await card(/Español/);

    expect(
      screen.getByText("Already speak English or French? Start from it."),
    ).toBeInTheDocument();
    const also = screen.getAllByRole("list")[1];
    expect(
      within(also)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["EnglishEnglish", "FrenchFrançais"]);
  });

  it("shows every country of a language once it is picked, the first one selected", async () => {
    renderWithProviders(<LandingGame />);

    await userEvent.click(await card(/Español/));

    const countries = screen.getByRole("group", { name: "Spanish countries" });
    const names = within(countries)
      .getAllByRole("button")
      .map((b) => b.textContent ?? "");
    expect(names).toHaveLength(LANGUAGES.es.regions.length);
    expect(names).toEqual(
      LANGUAGES.es.regions.map(regionName).sort((a, b) => a.localeCompare(b)),
    );
    expect(
      within(countries).getByRole("button", { name: "Spain", pressed: true }),
    ).toBeInTheDocument();
  });

  it("starts the round with the chosen country: Spanish up front, its flag, no star, no request", async () => {
    const { container } = renderWithProviders(<LandingGame />);
    await userEvent.click(await card(/Español/));
    await click("Bolivia");
    await click("Play");

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="es"]')).not.toBeNull();
    expect(screen.queryByText("English")).toBeNull();
    expect(screen.queryByRole("button", { name: /favorites/i })).toBeNull();

    await click("Reveal");

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(container.querySelector('img[src="/flags/bo.svg"]')).not.toBeNull();
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? "")).toEqual({
      lang: "es",
      region: "BO",
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("starts from English with its own country, then brings French and Spanish", async () => {
    const { container } = renderWithProviders(<LandingGame />);
    await userEvent.click(await card(/^EnglishEnglish$/));
    await click("Nigeria");
    await click("Play");

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="en"]')).not.toBeNull();
    expect(container.querySelector('img[src="/flags/ng.svg"]')).not.toBeNull();
    await click("Reveal");
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? "")).toEqual({
      lang: "en",
      region: "NG",
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("starts from French with its own country, then brings English and Spanish", async () => {
    renderWithProviders(<LandingGame />);
    await userEvent.click(await card(/^FrenchFrançais$/));
    await click("Haiti");
    await click("Play");

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="fr"]')).not.toBeNull();
    await click("Reveal");
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? "")).toEqual({
      lang: "fr",
      region: "HT",
    });
  });

  it("plays with the first country when none is chosen", async () => {
    renderWithProviders(<LandingGame />);
    await userEvent.click(await card(/Português/));

    await click("Play");

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? "")).toEqual({
      lang: "pt",
      region: "PT",
    });
  });

  it("starts at once for a language spoken in one country", async () => {
    renderWithProviders(<LandingGame />);

    await userEvent.click(await card(/Українська/));

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="uk"]')).not.toBeNull();
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? "")).toEqual({
      lang: "uk",
      region: "UA",
    });
  });

  it("folds the countries away when another language is picked", async () => {
    renderWithProviders(<LandingGame />);
    await userEvent.click(await card(/Español/));

    await userEvent.click(screen.getByRole("button", { name: /Português/ }));

    expect(
      screen.queryByRole("group", { name: "Spanish countries" }),
    ).toBeNull();
    expect(
      screen.getByRole("group", { name: "Portuguese countries" }),
    ).toBeInTheDocument();
  });

  it("starts the round on the next visit from a remembered language and country", async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ lang: "es", region: "BO" }),
    );
    renderWithProviders(<LandingGame />);

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Español/ })).toBeNull();
  });

  it("starts the round from a remembered English", async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ lang: "en", region: "IN" }),
    );
    renderWithProviders(<LandingGame />);

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="en"]')).not.toBeNull();
  });

  it("remembers a pick saved as just a language", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));
    renderWithProviders(<LandingGame />);

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="uk"]')).not.toBeNull();
  });

  it.each([
    ["an unknown language", JSON.stringify("zz")],
    ["garbage", "not json{"],
  ])("falls back to the cards for a stored pick that is %s", async (_n, stored) => {
    window.localStorage.setItem(KEY, stored);
    renderWithProviders(<LandingGame />);

    expect(await card(/Español/)).toBeInTheDocument();
  });

  it("returns to the cards with Change language, and forgets the pick", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));
    renderWithProviders(<LandingGame />);
    await screen.findByText("0 of 10");

    await click("Change language");

    expect(await card(/Español/)).toBeInTheDocument();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("moves focus into the round after a language is picked", async () => {
    renderWithProviders(<LandingGame />);
    await userEvent.click(await card(/Українська/));

    expect(
      await screen.findByRole("region", { name: "Practice round" }),
    ).toHaveFocus();
  });

  it("moves focus back to the cards after Change language", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));
    renderWithProviders(<LandingGame />);
    await screen.findByText("0 of 10");

    await click("Change language");

    expect(
      await screen.findByRole("region", { name: "Pick your language" }),
    ).toHaveFocus();
  });

  it("does not take focus when the page loads with a remembered pick", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));
    renderWithProviders(<LandingGame />);
    await screen.findByText("0 of 10");

    expect(
      screen.getByRole("region", { name: "Practice round" }),
    ).not.toHaveFocus();
  });

  it("after ten cards invites the visitor to sign up, with no talk of progress", async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ lang: "es", region: "BO" }),
    );
    renderWithProviders(<LandingGame />);
    await screen.findByText("0 of 10");

    for (let i = 0; i < 10; i++) {
      await click("Reveal");
      await click("Got it");
    }

    expect(await screen.findByText("Done")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Sign up to keep playing" }),
    ).toHaveAttribute("href", "/sign-in");
    expect(screen.queryByText(/progress/i)).toBeNull();

    await click("Practice again");

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(fetchStub).not.toHaveBeenCalled();
  });
});
