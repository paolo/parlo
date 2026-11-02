import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LANG_CODES, LANGUAGES } from "../../shared/languages";
import { LandingGame } from "./LandingGame";

const KEY = "parlo.visitor";
const click = (name: string | RegExp) =>
  userEvent.click(screen.getByRole("button", { name }));

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

  it("offers every language except English and French as the native pick", async () => {
    renderWithProviders(<LandingGame />);

    await screen.findByRole("button", { name: "Español" });
    const names = screen
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(names).toEqual(
      LANG_CODES.filter((c) => c !== "en" && c !== "fr").map(
        (c) => LANGUAGES[c].endonym,
      ),
    );
  });

  it("starts a round with the Spanish phrase up front, no star and no request", async () => {
    renderWithProviders(<LandingGame />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Español" }),
    );

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="es"]')).not.toBeNull();
    expect(screen.queryByText("English")).toBeNull();
    expect(screen.queryByRole("button", { name: /favorites/i })).toBeNull();

    await click("Reveal");

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(window.localStorage.getItem(KEY)).toBe('"es"');
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("remembers the pick and starts the round on the next visit", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));
    renderWithProviders(<LandingGame />);

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="uk"]')).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Español" })).toBeNull();
  });

  it.each([
    ["English", JSON.stringify("en")],
    ["garbage", "not json{"],
  ])("falls back to the picker for a stored pick that is %s", async (_n, stored) => {
    window.localStorage.setItem(KEY, stored);
    renderWithProviders(<LandingGame />);

    expect(
      await screen.findByRole("button", { name: "Español" }),
    ).toBeInTheDocument();
  });

  it("returns to the picker with Change language, and forgets the pick", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));
    renderWithProviders(<LandingGame />);
    await screen.findByText("0 of 10");

    await click("Change language");

    expect(
      await screen.findByRole("button", { name: "Español" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("after ten cards invites the visitor to sign up, with no talk of progress", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("es"));
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
