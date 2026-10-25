import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { LandingPage } from "./LandingPage";

const authClient = vi.hoisted(() => ({ signIn: { social: vi.fn() } }));
vi.mock("@/ui/auth-client", () => ({ authClient }));

describe("LandingPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the headline and subline", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Say it like a local." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/never word for word/i)).toBeInTheDocument();
  });

  it("offers Continue with Google", async () => {
    renderWithProviders(<LandingPage />);
    const [hero] = screen.getAllByRole("button", {
      name: "Continue with Google",
    });
    await userEvent.click(hero);
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
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

  it("starts Google from the closing call to action too", async () => {
    renderWithProviders(<LandingPage />);
    const buttons = screen.getAllByRole("button", {
      name: "Continue with Google",
    });
    await userEvent.click(buttons[buttons.length - 1] as HTMLElement);
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
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
