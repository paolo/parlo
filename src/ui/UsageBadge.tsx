"use client";

import { Badge, Tooltip } from "@mantine/core";
import { useUsage } from "./queries";

export function UsageBadge() {
  const { data } = useUsage();
  if (!data) return null;
  const exhausted = data.usedToday >= data.dailyLimit;
  const resetTime = new Date(data.resetAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <Tooltip
      label={`Translations used today. Resets at ${resetTime}.`}
      withArrow
    >
      <Badge
        variant={exhausted ? "light" : "default"}
        color={exhausted ? "red" : undefined}
        size="lg"
      >
        {data.usedToday}/{data.dailyLimit}
      </Badge>
    </Tooltip>
  );
}
