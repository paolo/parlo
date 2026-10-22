"use client";

import { Button, Group, Select, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import type { ProfileLanguage } from "@/server/profile/types";
import {
  LANG_CODES,
  LANGUAGES,
  type Lang,
  languageFlag,
  PROFILE_SIZE,
  regionFlag,
  regionName,
} from "../../shared/languages";
import { errorMessage } from "../errors";
import { useSaveProfile } from "../queries";

const SLOT_NAMES = ["Native language", "Second language", "Third language"];

interface Slot {
  lang: Lang | null;
  region: string | null;
}

export function LanguagePicker({
  initial,
  onSaved,
}: {
  /** The stored profile when editing; every slot then shows its region. Omit on first login. */
  initial?: ProfileLanguage[];
  onSaved?: () => void;
}) {
  const editing = initial !== undefined;
  const [slots, setSlots] = useState<Slot[]>(() =>
    Array.from({ length: PROFILE_SIZE }, (_, i) => ({
      lang: initial?.[i]?.lang ?? null,
      region: initial?.[i]?.region ?? null,
    })),
  );
  const save = useSaveProfile();

  function update(index: number, slot: Slot) {
    setSlots((current) => current.map((s, i) => (i === index ? slot : s)));
  }

  function submit() {
    const languages = slots.map(({ lang, region }, i) => {
      const chosen = lang as Lang;
      return editing || i === 0
        ? { lang: chosen, region: region ?? undefined }
        : { lang: chosen };
    });
    save.mutate(languages, {
      onSuccess: () => onSaved?.(),
      onError: (error) =>
        notifications.show({
          color: "red",
          title: "Couldn't save your languages",
          message: errorMessage(error),
        }),
    });
  }

  return (
    <Stack maw={480}>
      {slots.map((slot, index) => {
        const taken = slots.flatMap((s, i) =>
          i !== index && s.lang ? [s.lang] : [],
        );
        const showRegion = slot.lang !== null && (editing || index === 0);
        return (
          <Group
            key={SLOT_NAMES[index]}
            gap="xs"
            align="flex-end"
            wrap="nowrap"
          >
            <Select
              flex={1}
              label={SLOT_NAMES[index]}
              placeholder="Choose a language"
              value={slot.lang}
              data={LANG_CODES.filter((code) => !taken.includes(code)).map(
                (code) => ({
                  value: code,
                  label: `${languageFlag(code, null)} ${LANGUAGES[code].endonym}`,
                }),
              )}
              onChange={(value) =>
                update(index, {
                  lang: value as Lang | null,
                  region: value ? LANGUAGES[value as Lang].defaultRegion : null,
                })
              }
            />
            {showRegion && slot.lang && (
              // Closed, only the flag shows; the open list names each region.
              <Select
                w={92}
                aria-label={`${SLOT_NAMES[index]} region`}
                value={slot.region}
                allowDeselect={false}
                comboboxProps={{ width: 240, position: "bottom-end" }}
                data={LANGUAGES[slot.lang].regions.map((region) => ({
                  value: region,
                  label: regionFlag(region),
                }))}
                renderOption={({ option }) => (
                  <span>
                    {option.label} {regionName(option.value)}
                  </span>
                )}
                onChange={(value) => update(index, { ...slot, region: value })}
              />
            )}
          </Group>
        );
      })}
      <Button
        onClick={submit}
        loading={save.isPending}
        disabled={slots.some((s) => s.lang === null)}
      >
        Save languages
      </Button>
    </Stack>
  );
}
