"use client";

import { ActionIcon, Button } from "@mantine/core";
import { IconDeviceMobile, IconX } from "@tabler/icons-react";
import { useState } from "react";
import classes from "./InstallBanner.module.css";
import { InstallGuide } from "./InstallGuide";
import { useInstall } from "./install";
import { useInstallNudge } from "./nudge";

/** A one-time, dismissible invitation to install, shown once the user has translated a few phrases. */
export function InstallBanner() {
  const { kind, promptInstall } = useInstall();
  const { show, dismiss } = useInstallNudge();
  const [guide, setGuide] = useState(false);
  if (!show) return null;

  return (
    <aside className={classes.banner} aria-label="Install parlo">
      <IconDeviceMobile size={26} stroke={1.8} aria-hidden="true" />
      <div className={classes.text}>
        <strong>Keep parlo on your home screen</strong>
        <span>Open it like an app, one tap away.</span>
      </div>
      <Button
        variant="default"
        onClick={() => (kind === "prompt" ? promptInstall() : setGuide(true))}
      >
        {kind === "prompt" ? "Install" : "Show me how"}
      </Button>
      <ActionIcon
        variant="subtle"
        color="gray"
        size={44}
        radius="xl"
        aria-label="Not now"
        onClick={dismiss}
      >
        <IconX size={20} stroke={1.8} />
      </ActionIcon>
      <InstallGuide
        kind={kind}
        opened={guide}
        onClose={() => setGuide(false)}
      />
    </aside>
  );
}
