"use client";

import { useDocumentVisibility, useReducedMotion } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";

interface RotationOptions {
  intervalMs?: number;
}

/**
 * Drives the landing conversation: `step` goes up by one every `intervalMs`, except while the pointer or focus
 * is on it, while the tab is hidden, or when the visitor asked for reduced motion. `advance` always works.
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
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    }),
    [],
  );

  return { step, advance, pauseProps };
}
