"use client";

import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Loader,
  Menu,
  Stack,
} from "@mantine/core";
import {
  IconArrowsExchange,
  IconCheck,
  IconChevronDown,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import { BUNDLE_LOADERS } from "../../shared/bundles";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { errorMessage } from "../errors";
import { LangLabel } from "../LangLabel";
import { useAllFavorites, useProfile, useRecentGroups } from "../queries";
import { bundleToGroups } from "./bundles";
import { PracticeRound } from "./PracticeRound";
import { AnswerModeSelect, Field, PracticeSetup } from "./PracticeSetup";
import {
  dealtCount,
  loadPrefs,
  type PracticePrefs,
  resolveCount,
  resolveSource,
  type Source,
  savePrefs,
} from "./prefs";
import { SetupSummary } from "./SetupSummary";

export function ReviewView({ random }: { random?: () => number }) {
  const profile = useProfile();
  const favorites = useAllFavorites();
  const [saved] = useState(loadPrefs);
  // What the user changed on this visit; the rest comes from the remembered choice.
  const [picked, setPicked] = useState<Partial<PracticePrefs>>({});
  // Opens on a dealt round; Setup goes back to the setup screen.
  const [started, setStarted] = useState(true);
  const [chosen, setChosen] = useState<Lang | null>(null);
  const [mode, setMode] = useState<Mode>("flip");
  const [chosenAnswer, setChosenAnswer] = useState<Lang | null>(null);
  const [round, setRound] = useState(0);
  // How many cards the round dealt, fixed when it is dealt. Null until the first Start: the round dealt on
  // arrival takes its size from the remembered choice, once that source has loaded.
  const [dealtNow, setDealt] = useState<number | null>(null);
  const favoriteCount = favorites.data?.items.length ?? 0;
  // A remembered Favorites with nothing in it starts on Starter; picking it by hand is respected.
  const source = picked.source ?? resolveSource(saved, favoriteCount);
  const sources = useSources(
    favorites.data?.items,
    profile.data?.languages.map((l) => l.lang),
  );
  const counts = {
    favorites: favorites.data?.items.length,
    recent:
      sources.recent.status === "ready"
        ? sources.recent.groups.length
        : undefined,
    starter:
      sources.starter.status === "ready"
        ? sources.starter.groups.length
        : undefined,
  };
  const deck = sources[source];
  // A number of cards bigger than the source has becomes All.
  const count = resolveCount(
    picked.count ?? saved.count,
    counts[source] ?? Number.POSITIVE_INFINITY,
  );
  const available = counts[source];
  const dealt =
    dealtNow ?? (available === undefined ? 0 : dealtCount(count, available));

  if (profile.isPending || favorites.isPending) return <Loader size="sm" />;
  if (profile.isError || favorites.isError) {
    return (
      <Alert color="red" title="Couldn't load your phrasebook">
        {errorMessage(profile.error ?? favorites.error)}
      </Alert>
    );
  }
  const languages = profile.data.languages;
  // The native language on the front: read it, then recall the other two.
  const practice = chosen ?? languages[0].lang;
  // Typing defaults to the first other language.
  const others = languages.filter((l) => l.lang !== practice);
  const answerLang =
    chosenAnswer && chosenAnswer !== practice ? chosenAnswer : others[0]?.lang;
  const typing = mode === "type" && answerLang !== undefined;
  const restart = () => setRound((r) => r + 1);
  /** Deals a new round from `from`; the card count is fixed here so favoriting never changes the summary. */
  const dealRound = (from: Source) => {
    const available = counts[from];
    const wanted = picked.count ?? saved.count;
    setDealt(
      dealtCount(
        resolveCount(wanted, available ?? Number.POSITIVE_INFINITY),
        available ?? 0,
      ),
    );
    restart();
  };
  const switchToStarter = () => {
    setPicked((p) => ({ ...p, source: "starter" }));
    dealRound("starter");
  };

  if (!started) {
    return (
      <PracticeSetup
        source={source}
        count={count}
        counts={counts}
        onSource={(next) => setPicked((p) => ({ ...p, source: next }))}
        onCount={(next) => setPicked((p) => ({ ...p, count: next }))}
        onStart={() => {
          savePrefs({ source, count });
          dealRound(source);
          setStarted(true);
        }}
      >
        <Field label="How you answer">
          <AnswerModeSelect value={mode} onChange={setMode} />
        </Field>
        <Field label="Language">
          <Group gap="xs" wrap="nowrap">
            <LanguageMenu
              label="Practice in"
              languages={languages}
              value={practice}
              onChange={setChosen}
            />
            {typing && (
              <>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={44}
                  radius="xl"
                  aria-label="Swap languages"
                  onClick={() => {
                    setChosen(answerLang);
                    setChosenAnswer(practice);
                  }}
                >
                  <IconArrowsExchange size={20} stroke={1.8} />
                </ActionIcon>
                <LanguageMenu
                  label="Type in"
                  languages={others}
                  value={answerLang}
                  onChange={setChosenAnswer}
                />
              </>
            )}
          </Group>
        </Field>
      </PracticeSetup>
    );
  }

  return (
    <Stack gap="md" maw={720}>
      {(dealtNow !== null || deck.status !== "pending") && (
        <SetupSummary
          source={source}
          cards={dealt}
          onSetup={() => setStarted(false)}
        />
      )}
      {deck.status === "pending" && <Loader size="sm" />}
      {deck.status === "error" && (
        <Alert color="red" title="Couldn't load these phrases">
          {errorMessage(deck.error)}
          <Group mt="sm">
            <Button variant="default" onClick={switchToStarter}>
              Use Starter
            </Button>
          </Group>
        </Alert>
      )}
      {deck.status === "ready" && (
        <PracticeRound
          key={`${practice}-${typing ? answerLang : "flip"}-${round}`}
          groups={deck.groups}
          source={source}
          count={dealt}
          practice={practice}
          answerLang={typing ? answerLang : undefined}
          languages={languages}
          favorites
          random={random}
          onRestart={restart}
          onUseStarter={switchToStarter}
        />
      )}
    </Stack>
  );
}

type DeckState =
  | { status: "pending" }
  | { status: "error"; error: unknown }
  | { status: "ready"; groups: PhraseGroupDTO[] };

/** Every source's phrases; Recent and Starter load up front so the setup can show how many each has. */
function useSources(
  favorites: PhraseGroupDTO[] | undefined,
  profileLangs: Lang[] | undefined,
): Record<Source, DeckState> {
  const recent = useRecentGroups();
  const starter = useQuery({
    queryKey: ["bundle", "starter"],
    queryFn: () => BUNDLE_LOADERS.starter(),
    staleTime: Number.POSITIVE_INFINITY,
  });
  // Starter carries every language; a card only shows the viewer's own.
  const langKey = profileLangs?.join();
  // biome-ignore lint/correctness/useExhaustiveDependencies: langKey stands for profileLangs
  const starterGroups = useMemo(
    () =>
      starter.data && profileLangs
        ? bundleToGroups(starter.data, profileLangs)
        : undefined,
    [starter.data, langKey],
  );
  const state = (
    query: { isError: boolean; error: unknown },
    groups: PhraseGroupDTO[] | undefined,
  ): DeckState =>
    query.isError
      ? { status: "error", error: query.error }
      : groups
        ? { status: "ready", groups }
        : { status: "pending" };
  return {
    favorites: favorites
      ? { status: "ready", groups: favorites }
      : { status: "pending" },
    recent: state(recent, recent.data?.items),
    starter: state(starter, starterGroups),
  };
}

type Mode = "flip" | "type";

/** A language as a pill that opens a short list: one row of controls instead of a segmented control each. */
function LanguageMenu({
  label,
  languages,
  value,
  onChange,
}: {
  label: string;
  languages: ProfileLanguage[];
  value: Lang;
  onChange: (lang: Lang) => void;
}) {
  const current = languages.find((l) => l.lang === value);
  return (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Button
          variant="default"
          aria-label={`${label}: ${LANGUAGES[value].endonym}`}
          rightSection={<IconChevronDown size={16} stroke={1.8} />}
          style={{ minWidth: 0, flex: "0 1 auto" }}
        >
          <LangLabel lang={value} region={current?.region} showRegion={false} />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{label}</Menu.Label>
        {languages.map(({ lang, region }) => (
          <Menu.Item
            key={lang}
            aria-current={lang === value || undefined}
            rightSection={
              lang === value ? <IconCheck size={16} stroke={1.8} /> : null
            }
            onClick={() => onChange(lang)}
          >
            <LangLabel lang={lang} region={region} showRegion={false} />
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
