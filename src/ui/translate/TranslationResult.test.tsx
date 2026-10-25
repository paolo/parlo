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

  describe("accepting a correction", () => {
    afterEach(() => vi.unstubAllGlobals());

    const correction = {
      text: "Llegué tarde",
      explanation: "«Me tarde» no existe.",
      accepted: false,
    };
    const typed = makeGroup({
      correction,
      phrases: [
        { lang: "es", text: "me tarde", isRoot: true, correctedFrom: null },
        { lang: "en", text: "I was late", isRoot: false, correctedFrom: null },
        {
          lang: "fr",
          text: "J'étais en retard",
          isRoot: false,
          correctedFrom: null,
        },
      ],
    });
    const accepted = {
      ...typed,
      correction: { ...correction, accepted: true },
      phrases: [
        {
          lang: "es",
          text: "Llegué tarde",
          isRoot: true,
          correctedFrom: "me tarde",
        },
        ...typed.phrases.slice(1),
      ],
    };

    it("replaces the root text and marks the alert as applied", async () => {
      vi.stubGlobal(
        "fetch",
        // The labels also ask for the profile, to show the region the user picked.
        vi.fn(async (url: string) =>
          Response.json(
            url === "/api/profile" ? { languages: [] } : { group: accepted },
          ),
        ),
      );
      renderWithProviders(<TranslationResult group={typed} />);

      await userEvent.click(
        screen.getByRole("button", { name: /use corrected/i }),
      );

      expect(await screen.findByText("Correction applied")).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledWith(
        "/api/phrase-groups/g1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ acceptCorrection: true }),
        }),
      );
      expect(screen.getAllByText("Llegué tarde").length).toBeGreaterThan(0);
      expect(screen.getByText("me tarde")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /use corrected/i }),
      ).not.toBeInTheDocument();
    });

    it("keeps the button and shows an error when the request fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({ error: "already_accepted" }, { status: 409 }),
        ),
      );
      renderWithProviders(<TranslationResult group={typed} />);

      await userEvent.click(
        screen.getByRole("button", { name: /use corrected/i }),
      );

      await vi.waitFor(() => expect(notify).toHaveBeenCalled());
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "red",
          message: "That correction was already applied.",
        }),
      );
      expect(
        screen.getByRole("button", { name: /use corrected/i }),
      ).toBeInTheDocument();
    });
  });
});
