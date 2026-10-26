"use client";

import { Button, Modal } from "@mantine/core";
import {
  IconExternalLink,
  IconSquarePlus,
  IconUpload,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import classes from "./InstallGuide.module.css";
import type { InstallKind } from "./install";

function Step({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className={classes.step}>
      <span className={classes.icon} aria-hidden="true">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

/** iOS has no install dialog, so this says how to do it by hand. In an app's built-in browser it starts by leaving it. */
export function InstallGuide({
  kind,
  opened,
  onClose,
}: {
  kind: InstallKind;
  opened: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Add parlo to your home screen"
      centered
      radius="lg"
    >
      <p className={classes.lead}>
        It opens full screen, like an app, one tap away.
      </p>
      <ol className={classes.steps}>
        {kind === "in-app" && (
          <Step icon={<IconExternalLink size={22} stroke={1.8} />}>
            Open this page in Safari first: tap the menu and choose{" "}
            <strong>Open in Safari</strong>.
          </Step>
        )}
        <Step icon={<IconUpload size={22} stroke={1.8} />}>
          Tap the <strong>Share</strong> button in the browser bar.
        </Step>
        <Step icon={<IconSquarePlus size={22} stroke={1.8} />}>
          Scroll down and tap <strong>Add to Home Screen</strong>.
        </Step>
        <Step icon={<span className={classes.add}>Add</span>}>
          Tap <strong>Add</strong>. parlo is now on your home screen.
        </Step>
      </ol>
      <Button fullWidth onClick={onClose}>
        Got it
      </Button>
    </Modal>
  );
}
