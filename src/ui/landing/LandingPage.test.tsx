import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("shows the headline and subline", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Learn it the way locals say it.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all three of your languages/i),
    ).toBeInTheDocument();
  });

  it("takes the hero call to action to the game, not to sign-in", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole("link", { name: "Play a round" })).toHaveAttribute(
      "href",
      "#play",
    );
  });

  it("lets a visitor pick a language and play, replacing the old fixed demo", async () => {
    renderWithProviders(<LandingPage />);
    expect(
      await screen.findByRole("button", { name: /Español/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Costar un ojo de la cara")).toBeNull();
  });

  it("sends the closing call to action to the sign-in page", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole("link", { name: "Hop on" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("does not start Google from the landing page itself", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.queryByRole("button", { name: /continue with google/i }),
    ).not.toBeInTheDocument();
  });

  it("links Sign in to the sign-in page, which offers every way in", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(
      screen.queryByRole("button", { name: "Get started" }),
    ).not.toBeInTheDocument();
  });

  it("shows the conversation and no footer line", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("button", { name: /another phrase/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/made in canada/i)).not.toBeInTheDocument();
  });

  it("has a theme toggle", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("button", { name: /toggle light and dark theme/i }),
    ).toBeInTheDocument();
  });

  it("puts the start-here section in one place: pick a language, play, and it brings you to English and French", async () => {
    renderWithProviders(<LandingPage />);

    const heading = screen.getByRole("heading", {
      name: "Start here. We'll bring you there.",
    });
    const section = heading.closest("section") as HTMLElement;
    expect(section).toHaveAttribute("id", "play");
    expect(within(section).getByText(/English and French/)).toBeInTheDocument();
    expect(
      await within(section).findByRole("button", { name: /Español/ }),
    ).toBeInTheDocument();
    expect(within(section).getByText("Punjabi")).toBeInTheDocument();
  });

  it("no longer has a separate languages section", () => {
    renderWithProviders(<LandingPage />);

    expect(
      screen.queryByRole("heading", { name: /bring your three/i }),
    ).toBeNull();
    expect(screen.queryByText(/practice on the bus ride/i)).toBeNull();
  });

  it("closes with a title that starts on the bus ride", () => {
    renderWithProviders(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Your next bus ride could be a lesson.",
      }),
    ).toBeInTheDocument();
  });
});
