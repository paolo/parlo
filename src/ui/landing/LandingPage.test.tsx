import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LandingPage } from "./LandingPage";

describe("LandingPage", () => {
  it("shows the headline and subline", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Say it like a local." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/never word for word/i)).toBeInTheDocument();
  });

  it("sends the hero call to action to the sign-in page", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("link", { name: "Start with a phrase" }),
    ).toHaveAttribute("href", "/sign-in");
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

  it("lists every supported language", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(13);
    expect(screen.getByText("Українська")).toBeInTheDocument();
    expect(screen.getByText("Punjabi")).toBeInTheDocument();
  });
});
