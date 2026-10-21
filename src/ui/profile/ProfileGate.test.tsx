import { screen } from "@testing-library/react";
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

describe("ProfileGate", () => {
  afterEach(() => vi.unstubAllGlobals());

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
});
