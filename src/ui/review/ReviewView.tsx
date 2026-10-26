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
import Link from "next/link";
import { useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { errorMessage } from "../errors";
import { LangLabel } from "../LangLabel";
import { useAllFavorites, useProfile } from "../queries";
import { PracticeDeck } from "./PracticeDeck";
import { RevealPanel, TypedPanel } from "./PracticePanels";
import classes from "./ReviewView.module.css";
import { buildCards, ReviewSession } from "./session";

export function ReviewView({ random }: { random?: () => number }) {
  const profile = useProfile();
  const favorites = useAllFavorites();
  const [chosen, setChosen] = useState<Lang | null>(null);
  const [mode, setMode] = useState<Mode>("flip");
  const [chosenAnswer, setChosenAnswer] = useState<Lang | null>(null);
  const [round, setRound] = useState(0);

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
  const starred = favorites.data.items.length;
  // Typing defaults to the first other language (the native one, unless that is the one being practiced).
  const others = languages.filter((l) => l.lang !== practice);
  const answerLang =
    chosenAnswer && chosenAnswer !== practice ? chosenAnswer : others[0]?.lang;
  const typing = mode === "type" && answerLang !== undefined;
  const restart = () => setRound((r) => r + 1);
  return (
    <Stack gap="md" maw={720}>
      {starred > 0 && (
        <>
          {/* Two compact rows: what the deck is and how to practice it, then which languages. */}
          <Group justify="space-between" gap="sm">
            <DeckSummary count={starred} />
            <ModeSelect
              value={mode}
              onChange={(next) => {
                setMode(next);
                restart();
              }}
            />
          </Group>
          <Group gap="xs" wrap="nowrap">
            <LanguageMenu
              label="Practice in"
              languages={languages}
              value={practice}
              onChange={(lang) => {
                setChosen(lang);
                restart();
              }}
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
                    restart();
                  }}
                >
                  <IconArrowsExchange size={20} stroke={1.8} />
                </ActionIcon>
                <LanguageMenu
                  label="Type in"
                  languages={others}
                  value={answerLang}
                  onChange={(lang) => {
                    setChosenAnswer(lang);
                    restart();
                  }}
                />
              </>
            )}
          </Group>
        </>
      )}
      <Session
        key={`${practice}-${typing ? answerLang : "flip"}-${round}`}
        groups={favorites.data.items}
        practice={practice}
        answerLang={typing ? answerLang : undefined}
        profileLangs={languages.map((l) => l.lang)}
        random={random}
        onRestart={restart}
      />
      {/* Below the card, so the nudge never pushes it down. */}
      {starred > 0 && starred < SMALL_DECK && (
        <Text size="sm" c="dimmed">
          Small deck so far. Favorite more translations and they will join it.
        </Text>
      )}
    </Stack>
  );
}

/** Says which phrases the cards come from. A short deck gets a nudge, under the controls' first row. */
function DeckSummary({ count }: { count: number }) {
  return (
    <Group gap={6} wrap="nowrap" className={classes.summary}>
      <IconStar size={18} stroke={1.8} aria-hidden="true" />
      <Text fw={600} size="sm">
        {count} favorite {count === 1 ? "phrase" : "phrases"}
      </Text>
    </Group>
  );
}

const SMALL_DECK = 5;

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
  practice,
  answerLang,
  profileLangs,
  random,
  onRestart,
}: {
  groups: PhraseGroupDTO[];
  practice: Lang;
  /** Set when practicing by typing: the language of the phrase to write. */
  answerLang?: Lang;
  profileLangs: Lang[];
  random?: () => number;
  onRestart: () => void;
}) {
  const [built] = useState(() =>
    buildCards(groups, practice, profileLangs, answerLang),
  );
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
            ? `None of your favorite phrases have a ${needed} version. Try another language.`
            : "Practice uses your favorite phrases. Translate something, tap its star, and it joins your deck."}
        </Text>
        {skippedLine}
        <Button component={Link} href="/">
          Go to Translate
        </Button>
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
