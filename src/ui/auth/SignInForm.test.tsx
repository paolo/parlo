import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { SignInForm } from "./SignInForm";

const authClient = vi.hoisted(() => ({
  signIn: { social: vi.fn(), email: vi.fn() },
  signUp: { email: vi.fn() },
}));
vi.mock("@/ui/auth-client", () => ({ authClient }));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("SignInForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts Google sign-in", async () => {
    renderWithProviders(<SignInForm showPasswordForm={false} />);
    await userEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
  });

  it("hides the email form when password sign-in is disabled", () => {
    renderWithProviders(<SignInForm showPasswordForm={false} />);
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it("signs in with email and password when enabled", async () => {
    authClient.signIn.email.mockResolvedValue({ data: {}, error: null });
    renderWithProviders(<SignInForm showPasswordForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "me@test.dev");
    await userEvent.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: "me@test.dev",
      password: "password123",
    });
    expect(push).toHaveBeenCalledWith("/");
  });

  it("shows the error message when sign-in fails", async () => {
    authClient.signIn.email.mockResolvedValue({
      data: null,
      error: { message: "Invalid email or password" },
    });
    renderWithProviders(<SignInForm showPasswordForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "me@test.dev");
    await userEvent.type(
      screen.getByLabelText(/password/i, { selector: "input" }),
      "wrong-password",
    );
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(
      await screen.findByText("Invalid email or password"),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
