import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { PhrasebookView } from "./PhrasebookView";

const profile = [
  { lang: "es", region: "BO", level: "native", position: 0 },
  { lang: "en", region: "GB", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

function mockFavorites(groups: PhraseGroupDTO[], pageSize = 20) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === "/api/profile") return Response.json({ languages: profile });
    const cursor = new URL(url, "http://x").searchParams.get("cursor");
    const start = cursor ? Number(cursor) : 0;
    const next =
      start + pageSize < groups.length ? String(start + pageSize) : null;
    return Response.json({
      items: groups.slice(start, start + pageSize),
      nextCursor: next,
      limit: 100,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const starred = (id: string, fr: string) =>
  makeGroup({
    id,
    isFavorite: true,
    phrases: [
      { lang: "es", text: `es ${id}`, isRoot: true, correctedFrom: null },
      { lang: "fr", text: fr, isRoot: false, correctedFrom: null },
    ],
  });

describe("PhrasebookView", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists the starred groups from the favorites endpoint", async () => {
    const api = mockFavorites([makeGroup({ isFavorite: true })]);
    renderWithProviders(<PhrasebookView />);

    expect(await screen.findByText("Il pleut des cordes")).toBeInTheDocument();
    expect(screen.getByText("It's pouring")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove from phrasebook" }),
    ).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith(
      "/api/phrase-groups?favorite=true&limit=20",
      expect.anything(),
    );
  });

  it("pages with Load more and states the phrasebook limit", async () => {
    mockFavorites(
      [starred("a", "Un"), starred("b", "Deux"), starred("c", "Trois")],
      2,
    );
    renderWithProviders(<PhrasebookView />);
    await screen.findByText("Un");
    expect(
      screen.getByText("Holds up to 100 starred phrases."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Trois")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Trois")).toBeInTheDocument();
  });

  it("links to review mode when something is starred", async () => {
    mockFavorites([starred("a", "Un")]);
    renderWithProviders(<PhrasebookView />);

    expect(await screen.findByRole("link", { name: "Review" })).toHaveAttribute(
      "href",
      "/phrasebook/review",
    );
  });

  it("points to Translate and disables Review when nothing is starred yet", async () => {
    mockFavorites([]);
    renderWithProviders(<PhrasebookView />);

    expect(
      await screen.findByText(/haven't starred anything yet/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /translate/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("button", { name: "Review" })).toBeDisabled();
    expect(
      screen.queryByRole("link", { name: "Review" }),
    ).not.toBeInTheDocument();
  });

  it("shows one language at a time with the 'Show in' control", async () => {
    mockFavorites([starred("a", "Un")]);
    renderWithProviders(<PhrasebookView />);
    await screen.findByText("Un");

    await userEvent.click(
      await screen.findByRole("radio", { name: /Español/ }),
    );

    expect(await screen.findByText("es a")).toBeInTheDocument();
    expect(screen.queryByText("Un")).not.toBeInTheDocument();
  });
});
