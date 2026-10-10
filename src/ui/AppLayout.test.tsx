import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { AppLayout } from "./AppLayout";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/ui/auth-client", () => ({
  authClient: { useSession: () => ({ data: null }), signOut: vi.fn() },
}));

describe("AppLayout", () => {
  beforeEach(() => {
    pathname.current = "/";
  });

  it("renders the four main sections as links", () => {
    renderWithProviders(<AppLayout>content</AppLayout>);
    for (const [name, href] of [
      ["Translate", "/"],
      ["History", "/history"],
      ["Phrasebook", "/phrasebook"],
      ["Profile", "/profile"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("marks the link for the current path as active", () => {
    pathname.current = "/history";
    renderWithProviders(<AppLayout>content</AppLayout>);
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute(
      "data-active",
    );
    expect(screen.getByRole("link", { name: "Translate" })).not.toHaveAttribute(
      "data-active",
    );
  });
});
