import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UserMenu } from "./UserMenu";

const authClient = vi.hoisted(() => ({
  useSession: () => ({
    data: { user: { name: "Paolo", email: "paolo@test.dev", image: null } },
  }),
  signOut: vi.fn(async () => ({})),
}));
vi.mock("@/ui/auth-client", () => ({ authClient }));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("UserMenu", () => {
  it("signs out and returns to the sign-in page", async () => {
    renderWithProviders(<UserMenu />);
    await userEvent.click(
      screen.getByRole("button", { name: /account menu/i }),
    );
    expect(await screen.findByText("paolo@test.dev")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));
    expect(authClient.signOut).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/sign-in");
  });
});
