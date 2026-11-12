import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { MorphText } from "./MorphText";

const originalMatchMedia = window.matchMedia;

function setReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

describe("MorphText", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("animates the changed letters and gives assistive tech only the final text", () => {
    const { container } = renderWithProviders(
      <p>
        <MorphText from="que hora es" to="¿Qué hora es?" />
      </p>,
    );

    expect(screen.getByText("¿Qué hora es?")).toBeInTheDocument();
    const animated = container.querySelector("[aria-hidden='true']");
    expect(animated).not.toBeNull();
    // q → ¿Q and e → é go out and come in; the ? is added.
    expect(animated?.querySelectorAll("[data-kind='del']")).toHaveLength(2);
    expect(animated?.querySelectorAll("[data-kind='add']")).toHaveLength(3);
  });

  it("shows the final text alone when motion is reduced", () => {
    setReducedMotion(true);
    const { container } = renderWithProviders(
      <p>
        <MorphText from="que hora es" to="¿Qué hora es?" />
      </p>,
    );

    expect(container.querySelector("p")?.textContent).toBe("¿Qué hora es?");
    expect(container.querySelector("[aria-hidden='true']")).toBeNull();
  });
});
