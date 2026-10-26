"use client";

import {
  ActionIcon,
  Alert,
  Button,
  Group,
  List,
  Loader,
  Menu,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowsExchange,
  IconCheck,
  IconChevronDown,
  IconStar,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import { BUNDLE_LOADERS } from "../../shared/bundles";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { errorMessage } from "../errors";
import { LangLabel } from "../LangLabel";
import { useAllFavorites, useProfile, useRecentGroups } from "../queries";
import { bundleToGroups } from "./bundles";
import { PracticeDeck } from "./PracticeDeck";
import { RevealPanel, TypedPanel } from "./PracticePanels";
import { PracticeSetup } from "./PracticeSetup";
import {
  loadPrefs,
  type PracticePrefs,
  resolveSource,
  type Source,
  savePrefs,
} from "./prefs";
import classes from "./ReviewView.module.css";
import { SetupSummary } from "./SetupSummary";
import { buildCards, pickRandom, ReviewSession } from "./session";

export function ReviewView({ random }: { random?: () => number }) {
  const profile = useProfile();
  const favorites = useAllFavorites();
  const [saved] = useState(loadPrefs);
  // What the user changed on this visit; the rest comes from the remembered choice.
  const [picked, setPicked] = useState<Partial<PracticePrefs>>({});
  const [started, setStarted] = useState(false);
  const [chosen, setChosen] = useState<Lang | null>(null);
  const [mode, setMode] = useState<Mode>("flip");
  const [chosenAnswer, setChosenAnswer] = useState<Lang | null>(null);
  const [round, setRound] = useState(0);
  const favoriteCount = favorites.data?.items.length ?? 0;
  // A remembered Favorites with nothing in it starts on Starter; picking it by hand is respected.
  const source = picked.source ?? resolveSource(saved, favoriteCount);
  const count = picked.count ?? saved.count;
  const deck = useSourceGroups(source, favorites.data?.items ?? []);

  if (profile.isPending || favorites.isPending) return <Loader size="sm" />;
  if (profile.isError || favorites.isError) {
    return (
      <Alert color="red" title="Couldn't load your phrasebook">
        {errorMessage(profile.error ?? favorites.error)}
      </Alert>
    );
  }
  const languages = profile.data.languages;
  const practice = chosen ?? languages[1]?.lang ?? languages[0].lang;
  // Typing defaults to the first other language (the native one, unless that is the one being practiced).
  const others = languages.filter((l) => l.lang !== practice);
  const answerLang =
    chosenAnswer && chosenAnswer !== practice ? chosenAnswer : others[0]?.lang;
  const typing = mode === "type" && answerLang !== undefined;
  const restart = () => setRound((r) => r + 1);
  const switchToStarter = () => setPicked((p) => ({ ...p, source: "starter" }));

  if (!started) {
    return (
      <PracticeSetup
        source={source}
        count={count}
        onSource={(next) => setPicked((p) => ({ ...p, source: next }))}
        onCount={(next) => setPicked((p) => ({ ...p, count: next }))}
        onStart={() => {
          savePrefs({ source, count });
          restart();
          setStarted(true);
        }}
      >
        <ModeSelect value={mode} onChange={setMode} />
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
      </PracticeSetup>
    );
  }

  return (
    <Stack gap="md" maw={720}>
      <SetupSummary
        source={source}
        count={count}
        onChange={() => setStarted(false)}
      />
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
        <Session
          key={`${practice}-${typing ? answerLang : "flip"}-${round}`}
          groups={deck.groups}
          source={source}
          count={count}
          practice={practice}
          answerLang={typing ? answerLang : undefined}
          profileLangs={languages.map((l) => l.lang)}
          random={random}
          onRestart={restart}
          onUseStarter={() => {
            switchToStarter();
            restart();
          }}
        />
      )}
    </Stack>
  );
}

type DeckState =
  | { status: "pending" }
  | { status: "error"; error: unknown }
  | { status: "ready"; groups: PhraseGroupDTO[] };

/** The phrases of the chosen source; only that source is requested (Favorites are already loaded). */
function useSourceGroups(
  source: Source,
  favorites: PhraseGroupDTO[],
): DeckState {
  const recent = useRecentGroups({ enabled: source === "recent" });
  const starter = useQuery({
    queryKey: ["bundle", "starter"],
    queryFn: () => BUNDLE_LOADERS.starter().then(bundleToGroups),
    enabled: source === "starter",
    staleTime: Number.POSITIVE_INFINITY,
  });
  if (source === "favorites") return { status: "ready", groups: favorites };
  const query = source === "recent" ? recent : starter;
  if (query.isError) return { status: "error", error: query.error };
  if (!query.data) return { status: "pending" };
  return {
    status: "ready",
    groups: Array.isArray(query.data) ? query.data : query.data.items,
  };
}

type Mode = "flip" | "type";

function ModeSelect({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <SegmentedControl
      aria-label="How to practice"
      value={value}
      onChange={(next) => onChange(next as Mode)}
      data={[
        { value: "flip", label: "Flip" },
        { value: "type", label: "Type" },
      ]}
    />
  );
}

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

function snapshot(session: ReviewSession) {
  return {
    current: session.current,
    finished: session.finished,
    done: session.done,
    total: session.total,
    summary: session.summary(),
  };
}

function Session({
  groups,
  source,
  count,
  practice,
  answerLang,
  profileLangs,
  random,
  onRestart,
  onUseStarter,
}: {
  groups: PhraseGroupDTO[];
  source: Source;
  /** How many cards to deal, drawn at random; fewer when the source has fewer. */
  count: number;
  practice: Lang;
  /** Set when practicing by typing: the language of the phrase to write. */
  answerLang?: Lang;
  profileLangs: Lang[];
  random?: () => number;
  onRestart: () => void;
  onUseStarter: () => void;
}) {
  const [built] = useState(() => {
    const all = buildCards(groups, practice, profileLangs, answerLang);
    return { ...all, cards: pickRandom(all.cards, count, random) };
  });
  const [session] = useState(() => new ReviewSession(built.cards, random));
  // Plain snapshots in state: the session object mutates, React only sees new values.
  const [view, setView] = useState(() => snapshot(session));
  // Counts graded cards, so a card shown again after "Again" is dealt in afresh.
  const [step, setStep] = useState(0);

  function grade(result: "gotIt" | "again") {
    session[result]();
    setView(snapshot(session));
    setStep((n) => n + 1);
  }

  // Cards need a phrase in the practice language, and in the answer language when typing.
  const needed = answerLang
    ? `${LANGUAGES[practice].name} or ${LANGUAGES[answerLang].name}`
    : LANGUAGES[practice].name;
  const skippedLine = built.skipped > 0 && (
    <Text size="sm" c="dimmed">
      {built.skipped} {built.skipped === 1 ? "phrase" : "phrases"} skipped: no{" "}
      {needed} version
    </Text>
  );

  if (built.cards.length === 0) {
    const noVersion = built.skipped > 0;
    return (
      <div className={classes.empty}>
        <IconStar size={32} stroke={1.8} aria-hidden="true" />
        <Title order={3}>
          {noVersion ? `No ${needed} versions yet` : "Your deck is empty"}
        </Title>
        <Text c="dimmed">
          {noVersion
            ? `None of these phrases have a ${needed} version. Try another language.`
            : source === "recent"
              ? "Nothing translated yet. Translate something and it shows up here."
              : "Practice uses your favorite phrases. Translate something, tap its star, and it joins your deck."}
        </Text>
        {skippedLine}
        <Group gap="sm">
          <Button onClick={onUseStarter}>Use Starter</Button>
          <Button component={Link} href="/" variant="default">
            Go to Translate
          </Button>
        </Group>
      </div>
    );
  }

  if (view.finished) {
    const { firstTry, retried } = view.summary;
    return (
      <Stack gap="md">
        <Title order={3}>Done</Title>
        <Text>
          {firstTry} of {view.total} right on the first try
        </Text>
        {retried.length > 0 && (
          <Stack gap={4}>
            <Text size="sm" c="dimmed">
              Worth another look
            </Text>
            <List size="sm">
              {retried.map((card) => (
                <List.Item key={card.id}>{card.front.text}</List.Item>
              ))}
            </List>
          </Stack>
        )}
        <Group>
          <Button onClick={onRestart}>Practice again</Button>
          <Button component={Link} href="/phrasebook" variant="default">
            Back to phrasebook
          </Button>
        </Group>
      </Stack>
    );
  }

  const card = view.current;
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {view.done} of {view.total}
        </Text>
        {skippedLine}
      </Group>
      {card && (
        <PracticeDeck
          card={card}
          lang={practice}
          profileLangs={profileLangs}
          remaining={view.total - view.done}
          step={step}
        >
          {answerLang ? (
            <TypedPanel
              card={card}
              answerLang={answerLang}
              profileLangs={profileLangs}
              onGrade={grade}
            />
          ) : (
            <RevealPanel
              card={card}
              profileLangs={profileLangs}
              onGrade={grade}
            />
          )}
        </PracticeDeck>
      )}
    </Stack>
  );
}
