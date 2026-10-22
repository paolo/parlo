import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Conversation } from "./Conversation";
import { conversationAt } from "./phrases";

function phrases(step: number) {
  const { set, native } = conversationAt(step);
  return {
    set,
    native: set.phrases[native],
    en: set.phrases.en,
    fr: set.phrases.fr,
  };
}

describe("Conversation", () => {
  afterEach(() => vi.useRealTimers());

  it("shows the first conversation: native, English, French, in that order, each with a flag", () => {
    renderWithProviders(<Conversation />);
    const first = phrases(0);
    expect(
      screen.getAllByRole("img").map((el) => el.getAttribute("aria-label")),
    ).toEqual([
      "Spanish (Spain)",
      "English (United Kingdom)",
      "French (France)",
    ]);
    expect(screen.getAllByRole("img").map((el) => el.textContent)).toEqual([
      "🇪🇸",
      "🇬🇧",
      "🇫🇷",
    ]);
    const shown = [first.native, first.en, first.fr].map((text) =>
      screen.getByText(text),
    );
    for (const [a, b] of [
      [shown[0], shown[1]],
      [shown[1], shown[2]],
    ] as const) {
      expect(a?.compareDocumentPosition(b as Node)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }
  });

  it("shows no two-letter language codes", () => {
    renderWithProviders(<Conversation />);
    expect(screen.queryByText(/^(ES|EN|FR|PT|UK|ZH|HI|PA)$/)).toBeNull();
  });

  it("gives every bubble a minimum width so short phrases do not shrink it", () => {
    renderWithProviders(<Conversation />);
    for (const text of [phrases(0).native, phrases(0).en, phrases(0).fr]) {
      const bubble = screen.getByText(text).closest(".mantine-Paper-root");
      expect(bubble).toHaveStyle({ minWidth: "60%" });
    }
  });

  it("tags every phrase with its language", () => {
    renderWithProviders(<Conversation />);
    const first = phrases(0);
    expect(screen.getByText(first.native)).toHaveAttribute("lang", "es");
    expect(screen.getByText(first.en)).toHaveAttribute("lang", "en");
    expect(screen.getByText(first.fr)).toHaveAttribute("lang", "fr");
    expect(screen.getByText(first.fr)).toHaveAttribute("dir", "auto");
  });

  it("is one button named after the meaning and what it does", () => {
    renderWithProviders(<Conversation />);
    const { set } = phrases(0);
    const button = screen.getByRole("button", { name: /another phrase/i });
    expect(button).toHaveAccessibleName(new RegExp(set.meaning, "i"));
  });

  it("shows the next conversation when clicked", async () => {
    renderWithProviders(<Conversation />);
    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByText(phrases(1).native)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Portuguese (Brazil)" }),
    ).toHaveTextContent("🇧🇷");
    expect(screen.queryByRole("img", { name: /^Spanish/ })).toBeNull();
  });

  it.each(["{Enter}", " "])("advances with the %j key", async (key) => {
    renderWithProviders(<Conversation />);
    screen.getByRole("button").focus();
    await userEvent.keyboard(key);
    expect(
      await screen.findByRole("img", { name: "Portuguese (Brazil)" }),
    ).toBeInTheDocument();
  });

  it("advances by itself after the interval", () => {
    vi.useFakeTimers();
    renderWithProviders(<Conversation />);
    // The fade timer is only scheduled once the interval's state update has flushed, so advance in two steps.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(
      screen.getByRole("img", { name: "Portuguese (Brazil)" }),
    ).toBeInTheDocument();
  });

  it("marks Mandarin as Simplified Chinese", async () => {
    renderWithProviders(<Conversation />);
    for (let i = 0; i < 3; i++) {
      await userEvent.click(screen.getByRole("button"));
      await screen.findByRole("img", {
        name: [
          "Portuguese (Brazil)",
          "Ukrainian (Ukraine)",
          "Mandarin Chinese (China)",
        ][i] as string,
      });
    }
    expect(screen.getByText(phrases(3).native)).toHaveAttribute(
      "lang",
      "zh-Hans",
    );
  });

  it("does not announce rotations to screen readers", () => {
    const { container } = renderWithProviders(<Conversation />);
    expect(container.querySelector("[aria-live]")).toBeNull();
  });
});
