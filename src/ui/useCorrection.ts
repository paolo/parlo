"use client";

import { notifications } from "@mantine/notifications";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import { errorMessage } from "./errors";
import { withCorrection } from "./phrases";
import { useSetCorrectionApplied } from "./queries";

/**
 * A group's correction as the viewer sees it: applied or not, switched optimistically. The change shows at once
 * and is saved; if saving fails it goes back and a notification says so.
 */
export function useCorrection(group: PhraseGroupDTO) {
  const mutation = useSetCorrectionApplied();
  const stored = group.correction?.accepted ?? false;
  const ours = mutation.variables?.id === group.id;
  const applied =
    ours && mutation.isPending
      ? mutation.variables.applied
      : ours && mutation.isSuccess
        ? (mutation.data.group.correction?.accepted ?? stored)
        : stored;
  const shown = withCorrection(group, applied);
  const typed =
    withCorrection(group, false).phrases.find((p) => p.isRoot)?.text ?? "";

  function setApplied(next: boolean) {
    mutation.mutate(
      { id: group.id, applied: next },
      {
        onError: (error) =>
          notifications.show({
            color: "red",
            title: "Couldn't change the correction",
            message: errorMessage(error),
          }),
      },
    );
  }

  return { shown, applied, typed, setApplied };
}
