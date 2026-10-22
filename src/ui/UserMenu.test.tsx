import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UserMenu } from "./UserMenu";

const authClient = vi.hoisted(() => ({
  useSession: () => ({
    data: { user: { name: "Paolo", email: "paolo@test.dev", image: null } },
  }),
  signOut: vi.fn(),
}));
vi.mock("@/ui/auth-client", () => ({ authClient }));
const show = vi.hoisted(() => vi.fn());
vi.mock("@mantine/notifications", () => ({ notifications: { show } }));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const assign = vi.fn();

async function clickSignOut() {
  await userEvent.click(screen.getByRole("button", { name: /account menu/i }));
  await userEvent.click(
    await screen.findByRole("menuitem", { name: /sign out/i }),
  );
}

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClient.signOut.mockResolvedValue({ data: { success: true } });
    // jsdom cannot navigate; the menu reloads the page so no signed-in client state survives.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });
  });

  it("shows the signed-in email", async () => {
    renderWithProviders(<UserMenu />);
    await userEvent.click(
      screen.getByRole("button", { name: /account menu/i }),
    );
    expect(await screen.findByText("paolo@test.dev")).toBeInTheDocument();
  });

  it("links to the profile page", async () => {
    renderWithProviders(<UserMenu />);
    await userEvent.click(
      screen.getByRole("button", { name: /account menu/i }),
    );
    expect(
      await screen.findByRole("menuitem", { name: /profile/i }),
    ).toHaveAttribute("href", "/profile");
  });

  it("signs out and goes to the home page with a full page load", async () => {
    renderWithProviders(<UserMenu />);
    await clickSignOut();
    expect(authClient.signOut).toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith("/");
    expect(push).not.toHaveBeenCalled();
  });

  // The server can refuse (for example a rejected origin). Redirecting anyway made it look like it had worked
  // while the session cookie stayed.
  it("stays put and says so when the server refuses the sign-out", async () => {
    authClient.signOut.mockResolvedValue({
      data: null,
      error: { status: 403, message: "Invalid origin" },
    });
    renderWithProviders(<UserMenu />);
    await clickSignOut();
    expect(assign).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ color: "red", title: "Couldn't sign out" }),
    );
  });

  it("stays put and says so when the request fails outright", async () => {
    authClient.signOut.mockRejectedValue(new Error("network down"));
    renderWithProviders(<UserMenu />);
    await clickSignOut();
    expect(assign).not.toHaveBeenCalled();
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({ color: "red", title: "Couldn't sign out" }),
    );
  });
});
