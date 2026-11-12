import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { CorrectionPill } from "./CorrectionPill";

const correction = {
  text: "¿Qué hora es?",
  explanation: "Las preguntas abren con ¿ y qué lleva tilde.",
};

describe("CorrectionPill", () => {
  it("says Corrected and offers to keep what was typed", async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CorrectionPill
        correction={correction}
        typed="que hora es"
        lang="es"
        applied
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Corrected" }));

    expect(await screen.findByText("You typed")).toBeInTheDocument();
    const typed = screen.getByText("que hora es");
    expect(typed.tagName).toBe("S");
    expect(typed).toHaveAttribute("lang", "es");
    expect(typed).toHaveAttribute("dir", "auto");
    expect(screen.getByText(correction.explanation)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Keep what I typed" }),
    );
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("says Suggestion and offers to use the correction", async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CorrectionPill
        correction={correction}
        typed="que hora es"
        lang="es"
        applied={false}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Suggestion" }));

    expect(await screen.findByText("Suggested")).toBeInTheDocument();
    expect(screen.getByText("¿Qué hora es?")).toHaveAttribute("lang", "es");
    expect(screen.getByText(correction.explanation)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Use the correction" }),
    );
    expect(onChange).toHaveBeenCalledWith(true);
  });
  it("moves keyboard focus into the bubble and back to the pill", async () => {
    renderWithProviders(
      <CorrectionPill
        correction={correction}
        typed="que hora es"
        lang="es"
        applied
        onChange={() => {}}
      />,
    );
    const pill = screen.getByRole("button", { name: "Corrected" });
    pill.focus();

    await userEvent.keyboard("{Enter}");
    const keep = await screen.findByRole("button", {
      name: "Keep what I typed",
    });
    await vi.waitFor(() =>
      expect(keep.closest("[role='dialog']")).toContainElement(
        document.activeElement as HTMLElement,
      ),
    );

    await userEvent.keyboard("{Escape}");
    await vi.waitFor(() => expect(pill).toHaveFocus());
  });
});
