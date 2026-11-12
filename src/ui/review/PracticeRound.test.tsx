import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import { makeGroup } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render";
import { PracticeRound } from "./PracticeRound";

const keepOrder = () => 0.999999;

const languages: ProfileLanguage[] = [
  { lang: "es", region: "BO", level: "native", position: 0 },
  { lang: "en", region: "CA", level: "intermediate", position: 1 },
  { lang: "fr", region: "FR", level: "intermediate", position: 2 },
];

const card = (id: string, es: string, en: string, fr: string): PhraseGroupDTO =>
  makeGroup({
    id,
    phrases: [
      { lang: "es", text: es, isRoot: false, correctedFrom: null },
      { lang: "en", text: en, isRoot: false, correctedFrom: null },
      { lang: "fr", text: fr, isRoot: false, correctedFrom: null },
    ],
  });
const groups = [card("a", "Uno", "One", "Un"), card("b", "Dos", "Two", "Deux")];

function round(props: Partial<Parameters<typeof PracticeRound>[0]> = {}) {
  return renderWithProviders(
    <PracticeRound
      groups={groups}
      count={2}
      practice="es"
      languages={languages}
      favorites={false}
      random={keepOrder}
      onRestart={vi.fn()}
      {...props}
    />,
  );
}

describe("PracticeRound", () => {
  let fetchStub: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchStub = vi.fn(async () =>
      Response.json({ items: [], nextCursor: null, limit: 100 }),
    );
    vi.stubGlobal("fetch", fetchStub);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows no favorite star when favorites is false, and never calls fetch", async () => {
    round();

    expect(await screen.findByText("Uno")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("shows the star when favorites is true", async () => {
    round({ favorites: true });

    expect(
      await screen.findByRole("button", { name: "Save" }),
    ).toBeInTheDocument();
  });

  it("puts finishedFooter under the Done summary", async () => {
    round({ finishedFooter: <p>Sign up to keep playing</p> });

    for (let i = 0; i < 2; i++) {
      await userEvent.click(
        await screen.findByRole("button", { name: "Reveal" }),
      );
      await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    }

    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Sign up to keep playing")).toBeInTheDocument();
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("hides the empty-deck buttons without onUseStarter", () => {
    round({ groups: [] });

    expect(screen.getByText("Your deck is empty")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use Starter" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Go to Translate" })).toBeNull();
  });

  it("offers Use Starter on an empty deck when onUseStarter is given", async () => {
    const onUseStarter = vi.fn();
    round({ groups: [], onUseStarter });

    await userEvent.click(screen.getByRole("button", { name: "Use Starter" }));

    expect(onUseStarter).toHaveBeenCalled();
  });
});
