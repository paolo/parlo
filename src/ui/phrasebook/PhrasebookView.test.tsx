import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { PhrasebookView } from "./PhrasebookView";

const notify = vi.hoisted(() => vi.fn());
vi.mock("@mantine/notifications", () => ({ notifications: { show: notify } }));

const profile = [
  { lang: "es", region: "BO", level: "native", position: 0 },
  { lang: "en", region: "GB", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

const group = (id: string, es: string, fr: string): PhraseGroupDTO =>
  makeGroup({
    id,
    phrases: [
      { lang: "es", text: es, isRoot: true, correctedFrom: null },
      { lang: "en", text: `${es} (en)`, isRoot: false, correctedFrom: null },
      { lang: "fr", text: fr, isRoot: false, correctedFrom: null },
    ],
  });

const legacy = makeGroup({
  id: "legacy",
  phrases: [
    { lang: "es", text: "Hola viejo", isRoot: true, correctedFrom: null },
    {
      lang: "en",
      text: "Hello old friend",
      isRoot: false,
      correctedFrom: null,
    },
  ],
});

/** A fake API holding `groups`, paged by `pageSize`, where DELETE removes (or 404s on) a group. */
function mockApi(
  groups: PhraseGroupDTO[],
  {
    pageSize = 20,
    deleteStatus = 204,
  }: { pageSize?: number; deleteStatus?: number } = {},
) {
  let rows = [...groups];
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/profile") return Response.json({ languages: profile });
    if (init?.method === "DELETE") {
      rows = rows.filter((g) => !url.endsWith(`/${g.id}`));
      return deleteStatus === 204
        ? new Response(null, { status: 204 })
        : Response.json({ error: "not_found" }, { status: deleteStatus });
    }
    const params = new URL(url, "http://x").searchParams;
    const favorite = params.get("favorite") === "true";
    const cursor = params.get("cursor");
    const start = cursor ? Number(cursor) : 0;
    const matching = favorite ? rows.filter((g) => g.isFavorite) : rows;
    const items = matching.slice(start, start + pageSize);
    const next =
      start + pageSize < matching.length ? String(start + pageSize) : null;
    return Response.json({
      items,
      nextCursor: next,
      limit: favorite ? 100 : 500,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The Phrasebook opens on Starred; most of these tests are about the full list. */
async function renderAll() {
  renderWithProviders(<PhrasebookView />);
  const filter = screen.getByRole("radiogroup", { name: "Phrases" });
  await userEvent.click(within(filter).getByRole("radio", { name: "All" }));
}

describe("PhrasebookView", () => {
  const starred = (id: string, es: string, fr: string) => ({
    ...group(id, es, fr),
    isFavorite: true,
  });

  beforeEach(() => notify.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("lists the groups and the history limit note", async () => {
    mockApi([group("a", "Uno", "Un"), group("b", "Dos", "Deux")]);
    await renderAll();

    expect(await screen.findByText("Uno")).toBeInTheDocument();
    expect(screen.getByText("Dos")).toBeInTheDocument();
    expect(
      screen.getByText("Keeps your last 500 phrases. Starred phrases stay."),
    ).toBeInTheDocument();
  });

  it("loads more groups and hides the button on the last page", async () => {
    mockApi(
      [
        group("a", "Uno", "Un"),
        group("b", "Dos", "Deux"),
        group("c", "Tres", "Trois"),
      ],
      {
        pageSize: 2,
      },
    );
    await renderAll();
    await screen.findByText("Uno");
    expect(screen.queryByText("Tres")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Tres")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
  });

  it("shows only one language with the 'Show in' control", async () => {
    mockApi([group("a", "Uno", "Un")]);
    await renderAll();
    await screen.findByText("Uno");

    await userEvent.click(
      await screen.findByRole("radio", { name: /Français/ }),
    );

    expect(await screen.findByText("Un")).toBeInTheDocument();
    expect(screen.queryByText("Uno")).not.toBeInTheDocument();
    expect(screen.queryByText("Uno (en)")).not.toBeInTheDocument();
  });

  it("shows the original with a hint for groups that lack the chosen language", async () => {
    mockApi([legacy]);
    await renderAll();
    await screen.findByText("Hola viejo");

    await userEvent.click(
      await screen.findByRole("radio", { name: /Français/ }),
    );

    expect(await screen.findByText("Hola viejo")).toBeInTheDocument();
    expect(
      screen.getByText(/no français version, showing the original/i),
    ).toBeInTheDocument();
  });

  it("tells a new user how to fill the history", async () => {
    mockApi([]);
    await renderAll();

    expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /translate/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  describe("filtering", () => {
    it("starts on Starred and asks only for the favorites", async () => {
      const api = mockApi([
        group("a", "Uno", "Un"),
        starred("b", "Dos", "Deux"),
      ]);
      renderWithProviders(<PhrasebookView />);

      expect(await screen.findByText("Dos")).toBeInTheDocument();
      expect(screen.queryByText("Uno")).not.toBeInTheDocument();
      const filter = screen.getByRole("radiogroup", { name: "Phrases" });
      expect(
        within(filter).getByRole("radio", { name: "Starred" }),
      ).toBeChecked();
      expect(api).toHaveBeenCalledWith(
        "/api/phrase-groups?favorite=true&limit=20",
        expect.anything(),
      );
    });

    it("lists only starred phrases, with the phrasebook limit, under Starred", async () => {
      mockApi([group("a", "Uno", "Un"), starred("b", "Dos", "Deux")]);
      await renderAll();
      await screen.findByText("Uno");
      expect(screen.getByText("Dos")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("radio", { name: "Starred" }));

      expect(await screen.findByText("Dos")).toBeInTheDocument();
      expect(screen.queryByText("Uno")).not.toBeInTheDocument();
      expect(
        screen.getByText("Holds up to 100 starred phrases."),
      ).toBeInTheDocument();
    });

    it("says how to star something when nothing is starred", async () => {
      mockApi([group("a", "Uno", "Un")]);
      await renderAll();
      await screen.findByText("Uno");

      await userEvent.click(screen.getByRole("radio", { name: "Starred" }));

      expect(
        await screen.findByText(/haven't starred anything yet/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /translate/i })).toHaveAttribute(
        "href",
        "/",
      );
    });

    it("keeps the language choice when the filter changes", async () => {
      mockApi([starred("a", "Uno", "Un")]);
      await renderAll();
      await screen.findByText("Uno");
      await userEvent.click(
        await screen.findByRole("radio", { name: /Français/ }),
      );

      await userEvent.click(screen.getByRole("radio", { name: "Starred" }));

      expect(await screen.findByText("Un")).toBeInTheDocument();
      expect(screen.queryByText("Uno")).not.toBeInTheDocument();
    });
  });

  describe("deleting", () => {
    it("asks for confirmation, deletes, and removes the item", async () => {
      const api = mockApi([group("a", "Uno", "Un"), group("b", "Dos", "Deux")]);
      await renderAll();
      await screen.findByText("Uno");

      await userEvent.click(
        screen.getAllByRole("button", { name: "Delete phrase" })[0],
      );
      const dialog = await screen.findByRole("dialog");
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Delete" }),
      );

      await vi.waitFor(() =>
        expect(screen.queryByText("Uno")).not.toBeInTheDocument(),
      );
      expect(api).toHaveBeenCalledWith(
        "/api/phrase-groups/a",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(screen.getByText("Dos")).toBeInTheDocument();
    });

    it("sends nothing when the confirmation is cancelled", async () => {
      const api = mockApi([group("a", "Uno", "Un")]);
      await renderAll();
      await screen.findByText("Uno");

      await userEvent.click(
        screen.getByRole("button", { name: "Delete phrase" }),
      );
      const dialog = await screen.findByRole("dialog");
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Cancel" }),
      );

      expect(api).not.toHaveBeenCalledWith(
        expect.stringContaining("/a"),
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(screen.getByText("Uno")).toBeInTheDocument();
    });

    it("treats a group that is already gone as deleted, without an error", async () => {
      mockApi([group("a", "Uno", "Un")], { deleteStatus: 404 });
      await renderAll();
      await screen.findByText("Uno");

      await userEvent.click(
        screen.getByRole("button", { name: "Delete phrase" }),
      );
      const dialog = await screen.findByRole("dialog");
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Delete" }),
      );

      await vi.waitFor(() =>
        expect(screen.queryByText("Uno")).not.toBeInTheDocument(),
      );
      expect(notify).not.toHaveBeenCalled();
    });
  });
});
