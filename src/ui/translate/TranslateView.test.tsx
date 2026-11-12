import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TranslateView } from "./TranslateView";

const notify = vi.hoisted(() => vi.fn());
vi.mock("@mantine/notifications", () => ({ notifications: { show: notify } }));

const profile = [
  { lang: "es", region: "BO", level: "native", position: 0 },
  { lang: "en", region: "GB", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

/** The translation endpoint answers with these NDJSON lines; the rest of the API with what the page needs. */
function mockApi(lines: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url === "/api/translations") {
        return new Response(
          `${lines.map((l) => JSON.stringify(l)).join("\n")}\n`,
          { status: 201 },
        );
      }
      if (url === "/api/profile") return Response.json({ languages: profile });
      if (url === "/api/usage") {
        return Response.json({
          usedToday: 1,
          dailyLimit: 50,
          resetAt: new Date().toISOString(),
        });
      }
      return Response.json({}, { status: 404 });
    }),
  );
}

describe("TranslateView", () => {
  beforeEach(() => notify.mockReset());
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the cards and warns when the translation could not be saved", async () => {
    mockApi([
      { type: "detected", lang: "es" },
      { type: "translation", lang: "en", text: "What time is it?" },
      { type: "translation", lang: "fr", text: "Quelle heure est-il ?" },
      { type: "error", error: "save_failed" },
    ]);
    renderWithProviders(<TranslateView />);

    await userEvent.type(screen.getByRole("textbox"), "que hora es");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");

    expect(await screen.findByText("What time is it?")).toBeInTheDocument();
    expect(screen.getByText("Quelle heure est-il ?")).toBeInTheDocument();
    expect(
      screen.getByText("que hora es", { selector: "p" }),
    ).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Couldn't save this translation",
          message: "It won't be in your phrasebook.",
        }),
      ),
    );
    expect(notify).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: /save|phrasebook|favorite/i }),
    ).toBeNull();
  });
});
