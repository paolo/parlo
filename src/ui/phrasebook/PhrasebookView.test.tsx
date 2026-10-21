import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { PhrasebookView } from "./PhrasebookView";

function mockFavorites(items: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      Response.json(url === "/api/profile" ? { languages: [] } : { items }),
    ),
  );
}

describe("PhrasebookView", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists the starred trios", async () => {
    mockFavorites([makeGroup({ isFavorite: true })]);
    renderWithProviders(<PhrasebookView />);

    expect(await screen.findByText("Il pleut des cordes")).toBeInTheDocument();
    expect(screen.getByText("It's pouring")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove from phrasebook" }),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/phrase-groups?favorite=true",
      expect.anything(),
    );
  });

  it("points to Translate when nothing is starred yet", async () => {
    mockFavorites([]);
    renderWithProviders(<PhrasebookView />);

    expect(
      await screen.findByText(/haven't starred anything yet/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /translate/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
