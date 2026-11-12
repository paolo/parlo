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
  describe("while the answer is still arriving", () => {
    const partial = makeGroup({ id: "" });

    it("saves after the answer is stored when tapped while it streams", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({ group: makeGroup({ isFavorite: true }) }),
        ),
      );
      const { rerender } = renderWithProviders(
        <FavoriteButton group={partial} pending />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Save" }));

      expect(
        screen.getByRole("button", { name: "Remove from saved" }),
      ).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();

      rerender(<FavoriteButton group={makeGroup()} />);

      await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      expect(fetch).toHaveBeenCalledWith(
        "/api/phrase-groups/g1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ isFavorite: true }),
        }),
      );
      expect(
        await screen.findByRole("button", { name: "Remove from saved" }),
      ).toBeInTheDocument();
    });

    it("sends nothing when tapped twice while it streams", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Response.json({ group: makeGroup() })),
      );
      const { rerender } = renderWithProviders(
        <FavoriteButton group={partial} pending />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      await userEvent.click(
        screen.getByRole("button", { name: "Remove from saved" }),
      );
      rerender(<FavoriteButton group={makeGroup()} />);

      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(fetch).not.toHaveBeenCalled();
    });

    it("goes back and warns when the delayed save fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json(
            { error: "phrasebook_full", limit: 100 },
            { status: 409 },
          ),
        ),
      );
      const { rerender } = renderWithProviders(
        <FavoriteButton group={partial} pending />,
      );

      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      rerender(<FavoriteButton group={makeGroup()} />);

      expect(
        await screen.findByRole("button", { name: "Save" }),
      ).toBeInTheDocument();
      await vi.waitFor(() =>
        expect(notify).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Couldn't update your saved phrases",
            message:
              "Your phrasebook is full (100). Remove one to add another.",
          }),
        ),
      );
    });
  });
});
