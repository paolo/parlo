"use client";

import page from "./LandingPage.module.css";
import classes from "./NextLesson.module.css";
import { useRotation } from "./useRotation";

/** Everyday moments a few spare minutes can turn into a lesson; the title tries them in turn. */
export const ACTIVITIES = [
  "bus ride",
  "Uber ride",
  "wait in line",
  "coffee break",
  "flight",
  "lunch break",
  "walk to work",
  "grocery run",
] as const;

/** The closing title: "Your next bus ride could be a lesson", with the moment changing every few seconds. */
export function NextLesson() {
  const { step, pauseProps } = useRotation({ intervalMs: 3000 });
  const activity = ACTIVITIES[step % ACTIVITIES.length];
  return (
    <h2 className={page.closerTitle} {...pauseProps}>
      Your next{" "}
      <span key={activity} className={classes.activity}>
        {activity}
      </span>{" "}
      could be a lesson.
    </h2>
  );
}
