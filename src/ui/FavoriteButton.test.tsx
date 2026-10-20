import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { FavoriteButton } from "./FavoriteButton";

describe("FavoriteButton", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("stars the group and then offers to remove it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ group: makeGroup({ isFavorite: true }) }),
      ),
    );
    renderWithProviders(<FavoriteButton group={makeGroup()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Add to phrasebook" }),
    );

    expect(
      await screen.findByRole("button", { name: "Remove from phrasebook" }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/phrase-groups/g1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ isFavorite: true }),
      }),
    );
  });

  it("unstars a favorite", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ group: makeGroup() })),
    );
    renderWithProviders(
      <FavoriteButton group={makeGroup({ isFavorite: true })} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Remove from phrasebook" }),
    );

    expect(
      await screen.findByRole("button", { name: "Add to phrasebook" }),
    ).toBeInTheDocument();
  });

  it("goes back to the saved state when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "not_found" }, { status: 404 })),
    );
    renderWithProviders(<FavoriteButton group={makeGroup()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Add to phrasebook" }),
    );

    expect(
      await screen.findByRole("button", { name: "Add to phrasebook" }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
