import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ThemeSetting } from "./ThemeSetting";

const KEY = "mantine-color-scheme-value";

describe("ThemeSetting", () => {
  beforeEach(() => window.localStorage.clear());

  it("offers System, Light and Dark and stores nothing until a choice is made", () => {
    renderWithProviders(<ThemeSetting />);

    expect(
      screen.getAllByRole("radio").map((r) => r.getAttribute("value")),
    ).toEqual(["auto", "light", "dark"]);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("stores the choice where the landing toggle reads it", async () => {
    renderWithProviders(<ThemeSetting />);

    await userEvent.click(screen.getByText("Dark"));
    expect(window.localStorage.getItem(KEY)).toBe("dark");

    await userEvent.click(screen.getByText("Light"));
    expect(window.localStorage.getItem(KEY)).toBe("light");
  });

  it("goes back to following the system", async () => {
    window.localStorage.setItem(KEY, "dark");
    renderWithProviders(<ThemeSetting />);

    await userEvent.click(screen.getByText("System"));
    expect(window.localStorage.getItem(KEY)).toBe("auto");
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
  });

  it("shows a stored choice made on the landing page", async () => {
    window.localStorage.setItem(KEY, "light");
    renderWithProviders(<ThemeSetting />);

    expect(await screen.findByRole("radio", { name: "Light" })).toBeChecked();
  });
});
