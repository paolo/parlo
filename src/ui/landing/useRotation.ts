"use client";

import { useDocumentVisibility, useReducedMotion } from "@mantine/hooks";
import {
  type FocusEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

/** True for focus that arrived by keyboard; a click also focuses the element, and that must not pause it. */
function isKeyboardFocus(element: HTMLElement) {
  try {
    return element.matches(":focus-visible");
  } catch {
    // A browser without :focus-visible: pausing on any focus is the safe side for keyboard users.
    return true;
  }
}

interface RotationOptions {
  intervalMs?: number;
}

/**
 * Drives the landing conversation: `step` goes up by one every `intervalMs`, except while a mouse is over it or
 * keyboard focus is inside it, while the tab is hidden, or when the visitor asked for reduced motion. Touch
 * and click-focus never pause it: phones keep "hover" after a tap and a click keeps focus, so either would stop
 * it for good. `advance` always works.
 */
export function useRotation({ intervalMs = 5000 }: RotationOptions = {}) {
  const [step, setStep] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const visibility = useDocumentVisibility();

  const running =
    !hovered && !focused && !reducedMotion && visibility === "visible";

  const advance = useCallback(() => setStep((current) => current + 1), []);

  // `step` is a dependency so a manual advance restarts the countdown.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    if (!running) return;
    const id = setInterval(advance, intervalMs);
    return () => clearInterval(id);
  }, [running, intervalMs, step, advance]);

  const pauseProps = useMemo(
    () => ({
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") setHovered(true);
      },
      onPointerLeave: () => setHovered(false),
      onFocus: (event: FocusEvent<HTMLElement>) =>
        setFocused(isKeyboardFocus(event.currentTarget)),
      onBlur: () => setFocused(false),
    }),
    [],
  );

  return { step, advance, pauseProps };
}
