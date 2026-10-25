import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ThemeToggle } from "./ThemeToggle";

const KEY = "mantine-color-scheme-value";
const toggle = () =>
  screen.getByRole("button", { name: /toggle light and dark theme/i });

describe("ThemeToggle", () => {
  beforeEach(() => window.localStorage.clear());

  it("remembers nothing until it is used", () => {
    renderWithProviders(<ThemeToggle />);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("stores the choice so it survives a reload, and switches back on the next click", async () => {
    renderWithProviders(<ThemeToggle />);

    await userEvent.click(toggle());
    const first = window.localStorage.getItem(KEY);
    expect(["light", "dark"]).toContain(first);

    await userEvent.click(toggle());
    const second = window.localStorage.getItem(KEY);
    expect(["light", "dark"]).toContain(second);
    expect(second).not.toBe(first);
  });
});
