import { describe, expect, it } from "vitest";
import { theme } from "./theme";

describe("theme", () => {
  // iOS Safari zooms into any focused input under 16px, which also leaves a horizontal scroll behind.
  it.each([
    "Textarea",
    "TextInput",
    "PasswordInput",
    "Select",
  ])("renders %s at the 16px size", (name) => {
    expect(theme.components?.[name]?.defaultProps?.size).toBe("md");
  });
});
