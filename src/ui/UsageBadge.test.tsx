import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UsageBadge } from "./UsageBadge";

function mockUsage(usedToday: number, dailyLimit: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        usedToday,
        dailyLimit,
        resetAt: "2026-10-11T00:00:00.000Z",
      }),
    ),
  );
}

describe("UsageBadge", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows today's usage against the limit", async () => {
    mockUsage(12, 50);
    renderWithProviders(<UsageBadge />);
    expect(await screen.findByText("12/50")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/usage", expect.anything());
  });
});
