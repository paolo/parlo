import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import SignInPage from "./page";

vi.mock("@/ui/auth-client", () => ({
  authClient: { signIn: { social: vi.fn(), email: vi.fn() } },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("SignInPage", () => {
  it("shows the lowercase wordmark as the heading", () => {
    renderWithProviders(<SignInPage />);
    expect(screen.getByRole("heading", { name: "parlo" })).toBeInTheDocument();
    expect(screen.queryByText("Parlo")).toBeNull();
  });
});
