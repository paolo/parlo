import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRotation } from "./useRotation";

const INTERVAL = 5000;
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

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useRotation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it("starts at step 0 and advances once per interval", () => {
    const { result } = renderHook(() => useRotation());
    expect(result.current.step).toBe(0);
    tick(INTERVAL);
    expect(result.current.step).toBe(1);
    tick(INTERVAL);
    expect(result.current.step).toBe(2);
  });

  it("honors a custom interval", () => {
    const { result } = renderHook(() => useRotation({ intervalMs: 1000 }));
    tick(1000);
    expect(result.current.step).toBe(1);
  });

  it("pauses while the pointer is over it and resumes after", () => {
    const { result } = renderHook(() => useRotation());
    act(() => result.current.pauseProps.onMouseEnter());
    tick(INTERVAL * 3);
    expect(result.current.step).toBe(0);
    act(() => result.current.pauseProps.onMouseLeave());
    tick(INTERVAL);
    expect(result.current.step).toBe(1);
  });

  it("pauses while focus is inside it and resumes after", () => {
    const { result } = renderHook(() => useRotation());
    act(() => result.current.pauseProps.onFocus());
    tick(INTERVAL * 3);
    expect(result.current.step).toBe(0);
    act(() => result.current.pauseProps.onBlur());
    tick(INTERVAL);
    expect(result.current.step).toBe(1);
  });

  it("stays paused until both hover and focus are gone", () => {
    const { result } = renderHook(() => useRotation());
    act(() => {
      result.current.pauseProps.onMouseEnter();
      result.current.pauseProps.onFocus();
    });
    act(() => result.current.pauseProps.onMouseLeave());
    tick(INTERVAL * 2);
    expect(result.current.step).toBe(0);
  });

  it("does not advance while the tab is hidden", () => {
    const { result } = renderHook(() => useRotation());
    act(() => setVisibility("hidden"));
    tick(INTERVAL * 3);
    expect(result.current.step).toBe(0);
    act(() => setVisibility("visible"));
    tick(INTERVAL);
    expect(result.current.step).toBe(1);
  });

  it("never advances on its own with reduced motion", () => {
    setReducedMotion(true);
    const { result } = renderHook(() => useRotation());
    tick(INTERVAL * 3);
    expect(result.current.step).toBe(0);
  });

  it("advance() moves one step, even with reduced motion", () => {
    setReducedMotion(true);
    const { result } = renderHook(() => useRotation());
    act(() => result.current.advance());
    expect(result.current.step).toBe(1);
  });

  it("restarts the interval after advance() so a tap is not followed by an instant rotation", () => {
    const { result } = renderHook(() => useRotation());
    tick(INTERVAL - 100);
    act(() => result.current.advance());
    tick(200);
    expect(result.current.step).toBe(1);
  });
});
