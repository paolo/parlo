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
      screen.getByRole("heading", { name: "Three languages. One meaning." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Understand what people really say, and say what you mean like they would.",
      ),
    ).toBeInTheDocument();
  });

  it("offers Continue with Google", async () => {
    renderWithProviders(<LandingPage />);
    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
  });

  it("starts the same Google flow from the Sign in button", async () => {
    renderWithProviders(<LandingPage />);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
  });

  it("shows the conversation and no footer line", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("button", { name: /another phrase/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/made in canada/i)).not.toBeInTheDocument();
  });
});
