import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { GoogleSignInButton } from "./GoogleSignInButton";

const authClient = vi.hoisted(() => ({ signIn: { social: vi.fn() } }));
vi.mock("@/ui/auth-client", () => ({ authClient }));

describe("GoogleSignInButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts Google sign-in and returns to the app", async () => {
    renderWithProviders(<GoogleSignInButton />);
    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
  });

  it("shows the four-color Google mark, hidden from screen readers", () => {
    const { container } = renderWithProviders(<GoogleSignInButton />);
    const mark = container.querySelector("svg");
    expect(mark).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll("svg path").length).toBe(4);
  });
});
