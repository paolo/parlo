import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
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

  it("asks where you are from, listing countries and not English- or French-only ones", async () => {
    renderWithProviders(<LandingGame />);

    expect(
      await screen.findByRole("button", { name: "Bolivia" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Brazil" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nigeria" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Español" })).toBeNull();
  });

  it("starts a round with the Spanish phrase up front and Bolivia's flag, no star and no request", async () => {
    const { container } = renderWithProviders(<LandingGame />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Bolivia" }),
    );

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

  it("asks which language for Ukraine, then plays in it", async () => {
    renderWithProviders(<LandingGame />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Ukraine" }),
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Русский" }),
    );

    expect(await screen.findByText("0 of 10")).toBeInTheDocument();
    expect(document.querySelector('p[lang="ru"]')).not.toBeNull();
  });

  it("remembers a pick saved as just a language, from before countries", async () => {
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
      await screen.findByRole("button", { name: "Bolivia" }),
    ).toBeInTheDocument();
  });

  it("returns to the picker with Change country, and forgets the pick", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));
    renderWithProviders(<LandingGame />);
    await screen.findByText("0 of 10");

    await click("Change country");

    expect(
      await screen.findByRole("button", { name: "Bolivia" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("moves focus into the round after a country is picked", async () => {
    renderWithProviders(<LandingGame />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Bolivia" }),
    );

    expect(
      await screen.findByRole("region", { name: "Practice round" }),
    ).toHaveFocus();
  });

  it("moves focus back to the picker after Change country", async () => {
    window.localStorage.setItem(KEY, JSON.stringify("uk"));
    renderWithProviders(<LandingGame />);
    await screen.findByText("0 of 10");

    await click("Change country");

    expect(
      await screen.findByRole("region", { name: "Where are you from?" }),
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
