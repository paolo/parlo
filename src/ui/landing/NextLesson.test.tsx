import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIVITIES, NextLesson } from "./NextLesson";

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

const title = (activity: string) =>
  screen.getByRole("heading", {
    name: `Your next ${activity} could be a lesson.`,
  });

describe("NextLesson", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it("starts with a bus ride", () => {
    render(<NextLesson />);

    expect(title("bus ride")).toBeInTheDocument();
  });

  it("moves on to the next everyday moment every few seconds", () => {
    render(<NextLesson />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(title("Uber ride")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(title("wait in line")).toBeInTheDocument();
  });

  it("goes round again after the last one", () => {
    render(<NextLesson />);

    act(() => {
      vi.advanceTimersByTime(3000 * ACTIVITIES.length);
    });

    expect(title("bus ride")).toBeInTheDocument();
  });

  it("stays on the bus ride when the visitor asked for reduced motion", () => {
    setReducedMotion(true);
    render(<NextLesson />);

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(title("bus ride")).toBeInTheDocument();
  });
});
