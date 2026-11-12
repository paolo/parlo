import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { FavoriteButton } from "./FavoriteButton";

const notify = vi.hoisted(() => vi.fn());
vi.mock("@mantine/notifications", () => ({ notifications: { show: notify } }));

describe("FavoriteButton", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("saves the group and then offers to remove it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ group: makeGroup({ isFavorite: true }) }),
      ),
    );
    renderWithProviders(<FavoriteButton group={makeGroup()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByRole("button", { name: "Remove from saved" }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/phrase-groups/g1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ isFavorite: true }),
      }),
    );
  });

  it("removes a saved group", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ group: makeGroup() })),
    );
    renderWithProviders(
      <FavoriteButton group={makeGroup({ isFavorite: true })} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Remove from saved" }),
    );

    expect(
      await screen.findByRole("button", { name: "Save" }),
    ).toBeInTheDocument();
  });

  it("goes back to the saved state when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "not_found" }, { status: 404 })),
    );
    renderWithProviders(<FavoriteButton group={makeGroup()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByRole("button", { name: "Save" }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows a bookmark, filled once saved", () => {
    renderWithProviders(
      <FavoriteButton group={makeGroup({ isFavorite: true })} />,
    );
    expect(
      screen.getByRole("button", { name: "Remove from saved" }),
    ).toHaveAttribute("data-saved", "true");
  });

  it("warns that the saved phrases could not be updated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "not_found" }, { status: 404 })),
    );
    renderWithProviders(<FavoriteButton group={makeGroup()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Couldn't update your saved phrases",
        }),
      ),
    );
  });
});
