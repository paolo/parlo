import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ProfileGate } from "./ProfileGate";

const language = (lang: string, position: number) => ({
  lang,
  region: "XX",
  level: position === 0 ? "native" : "intermediate",
  position,
});

function mockProfile(languages: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ languages })),
  );
}

const VISITOR_KEY = "parlo.visitor";

describe("ProfileGate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("shows the picker instead of the page when the profile is empty", async () => {
    mockProfile([]);
    renderWithProviders(<ProfileGate>the app</ProfileGate>);

    expect(await screen.findByText(/pick your languages/i)).toBeInTheDocument();
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
  });

  it("shows the page when the profile has three languages", async () => {
    mockProfile([language("es", 0), language("en", 1), language("fr", 2)]);
    renderWithProviders(<ProfileGate>the app</ProfileGate>);

    expect(await screen.findByText("the app")).toBeInTheDocument();
  });

  it("shows a loader and not the page while the profile loads", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderWithProviders(<ProfileGate>the app</ProfileGate>);

    expect(screen.getByLabelText("Loading your profile")).toBeInTheDocument();
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
  });

  describe("with a native language picked on the landing page", () => {
    it("prefills the picker with the language and country when the profile is empty", async () => {
      window.localStorage.setItem(
        VISITOR_KEY,
        JSON.stringify({ lang: "es", region: "BO" }),
      );
      mockProfile([]);
      renderWithProviders(<ProfileGate>the app</ProfileGate>);

      expect(await screen.findByText(/Español · Bolivia/)).toBeInTheDocument();
      expect(screen.getByText(/English · Canada/)).toBeInTheDocument();
      expect(screen.getByText(/Français · France/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Save languages" }),
      ).toBeEnabled();
    });

    it("shows the normal empty picker when the stored pick is not usable", async () => {
      window.localStorage.setItem(VISITOR_KEY, JSON.stringify("en"));
      mockProfile([]);
      renderWithProviders(<ProfileGate>the app</ProfileGate>);

      expect(
        await screen.findByText(/pick your languages/i),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Choose a language")).toHaveLength(3);
    });

    it("clears the pick once the profile is saved", async () => {
      window.localStorage.setItem(VISITOR_KEY, JSON.stringify("uk"));
      const saved = [language("uk", 0), language("en", 1), language("fr", 2)];
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: string, init?: RequestInit) =>
          Response.json({ languages: init?.method === "PUT" ? saved : [] }),
        ),
      );
      renderWithProviders(<ProfileGate>the app</ProfileGate>);

      await userEvent.click(
        await screen.findByRole("button", { name: "Save languages" }),
      );

      expect(await screen.findByText("the app")).toBeInTheDocument();
      expect(window.localStorage.getItem(VISITOR_KEY)).toBeNull();
    });

    it("clears a pick that is still stored when the profile already exists", async () => {
      window.localStorage.setItem(VISITOR_KEY, JSON.stringify("uk"));
      mockProfile([language("es", 0), language("en", 1), language("fr", 2)]);
      renderWithProviders(<ProfileGate>the app</ProfileGate>);

      expect(await screen.findByText("the app")).toBeInTheDocument();
      expect(window.localStorage.getItem(VISITOR_KEY)).toBeNull();
    });
  });
});
