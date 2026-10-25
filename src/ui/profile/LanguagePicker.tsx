"use client";

import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import type { ProfileLanguage } from "@/server/profile/types";
import {
  LANG_CODES,
  LANGUAGES,
  type Lang,
  PROFILE_SIZE,
  regionName,
} from "../../shared/languages";
import { errorMessage } from "../errors";
import { Flag } from "../Flag";
import { useSaveProfile } from "../queries";
import { ROLES } from "../roles";
import classes from "./LanguagePicker.module.css";

const SLOT_NAMES = ["Native language", "Second language", "Third language"];

interface Slot {
  lang: Lang | null;
  region: string | null;
}

/**
 * Three rows, one per language slot, each opening to chips for the language and, where it matters, the country.
 * The first slot is the native language and always asks for a region; the learning slots ask for one when an
 * existing profile is being edited.
 */
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
  // Open the first slot that still needs a language; with all three chosen (editing) everything starts closed.
  const [open, setOpen] = useState<number | null>(() => {
    const missing = slots.findIndex((s) => s.lang === null);
    return missing === -1 ? null : missing;
  });
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
    <div className={classes.root}>
      <div className={classes.slots}>
        {slots.map((slot, index) => {
          const name = SLOT_NAMES[index];
          const role = ROLES[index];
          const taken = slots.flatMap((s, i) =>
            i !== index && s.lang ? [s.lang] : [],
          );
          const showRegion = slot.lang !== null && (editing || index === 0);
          const isOpen = open === index;
          const region = slot.lang
            ? (slot.region ?? LANGUAGES[slot.lang].defaultRegion)
            : null;
          const panelId = `slot-${index}`;
          return (
            <section key={name} className={classes.slot} data-role={role}>
              <button
                type="button"
                className={classes.head}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                {region ? (
                  <Flag region={region} size="34px" ring={role} />
                ) : (
                  <span className={classes.empty} aria-hidden="true" />
                )}
                <span className={classes.title}>
                  <span className={classes.role}>{name}</span>
                  <span className={classes.name}>
                    {slot.lang
                      ? `${LANGUAGES[slot.lang].endonym}${
                          showRegion && region ? ` · ${regionName(region)}` : ""
                        }`
                      : "Choose a language"}
                  </span>
                </span>
                <IconChevronDown
                  className={classes.chevron}
                  size={18}
                  stroke={2}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div id={panelId} className={classes.panel}>
                  <fieldset
                    aria-label={`${name} language`}
                    className={classes.chips}
                  >
                    {LANG_CODES.filter((code) => !taken.includes(code)).map(
                      (code) => (
                        <button
                          key={code}
                          type="button"
                          className={classes.chip}
                          aria-pressed={slot.lang === code}
                          onClick={() =>
                            update(index, {
                              lang: code,
                              region: LANGUAGES[code].defaultRegion,
                            })
                          }
                        >
                          {LANGUAGES[code].endonym}
                        </button>
                      ),
                    )}
                  </fieldset>
                  {showRegion && slot.lang && (
                    <>
                      <span className={classes.hint}>
                        Where is your {LANGUAGES[slot.lang].name} from? It
                        changes the slang Parlo suggests.
                      </span>
                      <fieldset
                        aria-label={`${name} region`}
                        className={classes.chips}
                      >
                        {LANGUAGES[slot.lang].regions.map((code) => (
                          <button
                            key={code}
                            type="button"
                            className={classes.chip}
                            data-country=""
                            aria-pressed={region === code}
                            onClick={() =>
                              update(index, { ...slot, region: code })
                            }
                          >
                            <Flag region={code} size="26px" />
                            {regionName(code)}
                          </button>
                        ))}
                      </fieldset>
                    </>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <Button
        onClick={submit}
        loading={save.isPending}
        disabled={slots.some((s) => s.lang === null)}
      >
        Save languages
      </Button>
    </div>
  );
}
