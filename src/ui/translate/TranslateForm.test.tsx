import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TranslateForm } from "./TranslateForm";

describe("TranslateForm", () => {
  it("submits the typed phrase with the button", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<TranslateForm onSubmit={onSubmit} pending={false} />);
    await userEvent.type(screen.getByRole("textbox"), "me late the train");
    await userEvent.click(screen.getByRole("button", { name: /translate/i }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("me late the train");
  });

  it("submits with Ctrl+Enter and Cmd+Enter", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<TranslateForm onSubmit={onSubmit} pending={false} />);
    const box = screen.getByRole("textbox");
    await userEvent.type(box, "hola");
    fireEvent.keyDown(box, { key: "Enter", ctrlKey: true });
    fireEvent.keyDown(box, { key: "Enter", metaKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("ignores clicks and the shortcut while a translation is pending", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<TranslateForm onSubmit={onSubmit} pending />);
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "hola" } });
    fireEvent.keyDown(box, { key: "Enter", ctrlKey: true });
    fireEvent.click(screen.getByRole("button", { name: /translate/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not submit an empty or whitespace-only phrase", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<TranslateForm onSubmit={onSubmit} pending={false} />);
    await userEvent.type(screen.getByRole("textbox"), "   ");
    fireEvent.keyDown(screen.getByRole("textbox"), {
      key: "Enter",
      ctrlKey: true,
    });
    expect(screen.getByRole("button", { name: /translate/i })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a character counter capped at 500", async () => {
    renderWithProviders(<TranslateForm onSubmit={vi.fn()} pending={false} />);
    await userEvent.type(screen.getByRole("textbox"), "hola");
    expect(screen.getByText("4/500")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "500");
  });

  it("invites any of the user's languages", () => {
    renderWithProviders(<TranslateForm onSubmit={vi.fn()} pending={false} />);

    expect(
      screen.getByPlaceholderText("Type a phrase in any of your languages…"),
    ).toBeInTheDocument();
  });
});
