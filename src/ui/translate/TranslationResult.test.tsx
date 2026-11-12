import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { TranslationResult } from "./TranslationResult";

const notify = vi.hoisted(() => vi.fn());
vi.mock("@mantine/notifications", () => ({ notifications: { show: notify } }));

const phrase = (lang: "pt" | "en" | "fr", text: string, isRoot = false) => ({
  lang,
  text,
  isRoot,
  correctedFrom: null,
});

describe("TranslationResult", () => {
  it("offers the bookmark while the answer is still arriving", () => {
    renderWithProviders(
      <TranslationResult group={makeGroup({ id: "" })} pending />,
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("offers no bookmark for an answer that could not be saved", () => {
    renderWithProviders(<TranslationResult group={makeGroup()} unsaved />);
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
  });

  it("keeps a pending tap when the stored group replaces the partial one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url === "/api/profile"
          ? Response.json({ languages: [] })
          : Response.json({ group: makeGroup({ isFavorite: true }) }),
      ),
    );
    const { rerender } = renderWithProviders(
      <TranslationResult group={makeGroup({ id: "" })} pending />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    rerender(<TranslationResult group={makeGroup()} />);

    await vi.waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/phrase-groups/g1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    vi.unstubAllGlobals();
  });

  it("renders one card per phrase for any languages and names the detected one", () => {
    const group = makeGroup({
      phrases: [
        phrase("pt", "Tô com saudade", true),
        phrase("en", "I miss you"),
        phrase("fr", "Tu me manques"),
      ],
    });
    renderWithProviders(<TranslationResult group={group} />);

    expect(screen.getByText("Tô com saudade")).toBeInTheDocument();
    expect(screen.getByText("I miss you")).toBeInTheDocument();
    expect(screen.getByText("Tu me manques")).toBeInTheDocument();
    const detected = screen.getByText("Detected").parentElement;
    expect(detected).toHaveTextContent(/português/i);
  });

  it("still shows every phrase of a legacy es/en/fr group for a pt/en/fr profile", () => {
    renderWithProviders(
      <TranslationResult
        group={makeGroup()}
        profileLangs={["pt", "en", "fr"]}
      />,
    );

    expect(screen.getByText("Llueve a cántaros")).toBeInTheDocument();
    expect(screen.getByText("It's pouring")).toBeInTheDocument();
    expect(screen.getByText("Il pleut des cordes")).toBeInTheDocument();
  });

  describe("corrections", () => {
    afterEach(() => vi.unstubAllGlobals());

    const correction = {
      text: "Llegué tarde",
      explanation: "«Me tarde» no existe.",
    };
    const others = [
      {
        lang: "en" as const,
        text: "I was late",
        isRoot: false,
        correctedFrom: null,
      },
      {
        lang: "fr" as const,
        text: "J'étais en retard",
        isRoot: false,
        correctedFrom: null,
      },
    ];
    const applied = makeGroup({
      correction: { ...correction, accepted: true },
      phrases: [
        {
          lang: "es",
          text: "Llegué tarde",
          isRoot: true,
          correctedFrom: "me tarde",
        },
        ...others,
      ],
    });
    const typed = makeGroup({
      correction: { ...correction, accepted: false },
      phrases: [
        { lang: "es", text: "me tarde", isRoot: true, correctedFrom: null },
        ...others,
      ],
    });
    const plain = makeGroup({
      phrases: [
        { lang: "es", text: "Llegué tarde", isRoot: true, correctedFrom: null },
        ...others,
      ],
    });

    /** Answers the profile, and a PATCH with `group` (or the error status). */
    function api(group: unknown, status = 200) {
      const fn = vi.fn(async (url: string, _init?: RequestInit) =>
        url === "/api/profile"
          ? Response.json({ languages: [] })
          : status === 200
            ? Response.json({ group })
            : Response.json({ error: "not_found" }, { status }),
      );
      vi.stubGlobal("fetch", fn);
      return fn;
    }
    const patches = (fn: ReturnType<typeof api>) =>
      fn.mock.calls.filter(
        ([, init]) => (init as RequestInit)?.method === "PATCH",
      );

    it("shows Corrected on the root card for an applied correction, with no box above the cards", () => {
      renderWithProviders(<TranslationResult group={applied} />);

      expect(
        screen.getByRole("button", { name: "Corrected" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Llegué tarde")).toBeInTheDocument();
      expect(screen.queryByText(/original/i)).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Show correction" }),
      ).toBeNull();
    });

    it("Keep what I typed shows the typed text at once and saves it", async () => {
      const fn = api(typed);
      renderWithProviders(<TranslationResult group={applied} />);

      await userEvent.click(screen.getByRole("button", { name: "Corrected" }));
      await userEvent.click(
        await screen.findByRole("button", { name: "Keep what I typed" }),
      );

      expect(
        await screen.findByRole("button", { name: "Suggestion" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("me tarde", { selector: "p" }),
      ).toBeInTheDocument();
      expect(patches(fn)).toHaveLength(1);
      expect(patches(fn)[0][0]).toBe("/api/phrase-groups/g1");
      expect(
        JSON.parse((patches(fn)[0][1] as RequestInit).body as string),
      ).toEqual({
        correctionApplied: false,
      });
    });

    it("goes back and warns when the change fails", async () => {
      api(null, 404);
      renderWithProviders(<TranslationResult group={applied} />);

      await userEvent.click(screen.getByRole("button", { name: "Corrected" }));
      await userEvent.click(
        await screen.findByRole("button", { name: "Keep what I typed" }),
      );

      await vi.waitFor(() =>
        expect(notify).toHaveBeenCalledWith(
          expect.objectContaining({
            color: "red",
            title: "Couldn't change the correction",
          }),
        ),
      );
      expect(
        screen.getByRole("button", { name: "Corrected" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Llegué tarde", { selector: "p" }),
      ).toBeInTheDocument();
    });

    it("shows Suggestion for an old group whose correction was not applied, and applies it", async () => {
      const fn = api(applied);
      renderWithProviders(<TranslationResult group={typed} />);

      await userEvent.click(screen.getByRole("button", { name: "Suggestion" }));
      await userEvent.click(
        await screen.findByRole("button", { name: "Use the correction" }),
      );

      expect(
        await screen.findByRole("button", { name: "Corrected" }),
      ).toBeInTheDocument();
      expect(
        JSON.parse((patches(fn)[0][1] as RequestInit).body as string),
      ).toEqual({
        correctionApplied: true,
      });
    });

    it("offers no pill when there is no correction", () => {
      renderWithProviders(<TranslationResult group={plain} />);

      expect(screen.getByText("Original")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /corrected|suggestion/i }),
      ).toBeNull();
    });

    it("morphs the root card when the stored group replaces the partial one", () => {
      const partial = makeGroup({
        id: "",
        phrases: [
          { lang: "es", text: "me tarde", isRoot: true, correctedFrom: null },
          ...others,
        ],
      });
      const { container, rerender } = renderWithProviders(
        <TranslationResult group={partial} pending animate />,
      );
      expect(
        container.querySelector("[aria-hidden='true'] [data-kind]"),
      ).toBeNull();

      rerender(<TranslationResult group={applied} animate />);

      expect(container.querySelector("[data-kind='del']")).not.toBeNull();
      expect(screen.getByText("Llegué tarde")).toBeInTheDocument();
    });

    it("does not morph in the Phrasebook", () => {
      const { container, rerender } = renderWithProviders(
        <TranslationResult group={typed} />,
      );
      rerender(<TranslationResult group={applied} />);

      expect(container.querySelector("[data-kind]")).toBeNull();
    });
  });
});
