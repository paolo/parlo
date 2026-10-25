import { screen, within } from "@testing-library/react";
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

  it("shows the wordmark, linked home", () => {
    renderWithProviders(<AppLayout>content</AppLayout>);
    expect(screen.getByRole("link", { name: "parlo, home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("img", { name: "parlo" })).toBeInTheDocument();
    expect(screen.queryByText("Parlo")).toBeNull();
  });

  it("puts the sections in a labelled navigation", () => {
    renderWithProviders(<AppLayout>content</AppLayout>);
    expect(
      within(screen.getByRole("navigation", { name: "Main" })).getAllByRole(
        "link",
      ),
    ).toHaveLength(3);
  });

  it("renders the three main sections as links", () => {
    renderWithProviders(<AppLayout>content</AppLayout>);
    for (const [name, href] of [
      ["Translate", "/"],
      ["Phrasebook", "/phrasebook"],
      ["Practice", "/practice"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(screen.queryByRole("link", { name: "Profile" })).toBeNull();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("marks the link for the current path as active", () => {
    pathname.current = "/practice";
    renderWithProviders(<AppLayout>content</AppLayout>);
    expect(screen.getByRole("link", { name: "Practice" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Translate" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
