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

  it("starts the same flow from Get started and the closing call to action", async () => {
    renderWithProviders(<LandingPage />);
    await userEvent.click(screen.getByRole("button", { name: "Get started" }));
    const buttons = screen.getAllByRole("button", {
      name: "Continue with Google",
    });
    await userEvent.click(buttons[buttons.length - 1] as HTMLElement);
    expect(authClient.signIn.social).toHaveBeenCalledTimes(2);
  });

  it("lists every supported language", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(13);
    expect(screen.getByText("Українська")).toBeInTheDocument();
    expect(screen.getByText("Punjabi")).toBeInTheDocument();
  });
});
