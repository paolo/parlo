import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { CorrectionAlert } from "./CorrectionAlert";

const correction = {
  text: "J'ai hâte d'être à la fête",
  explanation: "«Excité» suena raro aquí.",
  accepted: false,
};

describe("CorrectionAlert", () => {
  it("shows the original, the suggestion and the explanation", () => {
    renderWithProviders(
      <CorrectionAlert
        original="je suis excité pour la fête"
        correction={correction}
      />,
    );
    expect(screen.getByText("je suis excité pour la fête")).toBeInTheDocument();
    expect(screen.getByText("J'ai hâte d'être à la fête")).toBeInTheDocument();
    expect(screen.getByText("«Excité» suena raro aquí.")).toBeInTheDocument();
  });

  it("lets the user accept the suggestion when a handler is given", async () => {
    const onAccept = vi.fn();
    renderWithProviders(
      <CorrectionAlert
        original="x"
        correction={correction}
        onAccept={onAccept}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /use corrected/i }),
    );
    expect(onAccept).toHaveBeenCalled();
  });

  it("hides the accept button once accepted or without a handler", () => {
    const { unmount } = renderWithProviders(
      <CorrectionAlert original="x" correction={correction} />,
    );
    expect(
      screen.queryByRole("button", { name: /use corrected/i }),
    ).not.toBeInTheDocument();
    unmount();
    renderWithProviders(
      <CorrectionAlert
        original="x"
        correction={{ ...correction, accepted: true }}
        onAccept={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /use corrected/i }),
    ).not.toBeInTheDocument();
  });

  it("says the correction was applied, without a button, once accepted", () => {
    renderWithProviders(
      <CorrectionAlert
        original="x"
        correction={{ ...correction, accepted: true }}
        onAccept={vi.fn()}
      />,
    );
    expect(screen.getByText("Correction applied")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /use corrected/i }),
    ).not.toBeInTheDocument();
  });

  it("has a close button only when it can be hidden", async () => {
    const onClose = vi.fn();
    const { unmount } = renderWithProviders(
      <CorrectionAlert original="x" correction={correction} />,
    );
    expect(
      screen.queryByRole("button", { name: "Hide correction" }),
    ).not.toBeInTheDocument();
    unmount();

    renderWithProviders(
      <CorrectionAlert
        original="x"
        correction={correction}
        onClose={onClose}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Hide correction" }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
