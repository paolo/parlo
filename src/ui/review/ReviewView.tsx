"use client";

import {
  Alert,
  Box,
  Button,
  Group,
  List,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconStar } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { errorMessage } from "../errors";
import { LangLabel } from "../LangLabel";
import { useAllFavorites, useProfile } from "../queries";
import { PracticeDeck } from "./PracticeDeck";
import classes from "./ReviewView.module.css";
import { buildCards, ReviewSession } from "./session";

export function ReviewView({ random }: { random?: () => number }) {
  const profile = useProfile();
  const favorites = useAllFavorites();
  const [chosen, setChosen] = useState<Lang | null>(null);
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
  return (
    <Stack gap="lg" maw={720}>
      <DeckSummary count={starred} />
      {starred > 0 && (
        <PracticeLanguage
          languages={languages}
          value={practice}
          onChange={(lang) => {
            setChosen(lang);
            setRound((r) => r + 1);
          }}
        />
      )}
      <Session
        key={`${practice}-${round}`}
        groups={favorites.data.items}
        practice={practice}
        profileLangs={languages.map((l) => l.lang)}
        random={random}
        onRestart={() => setRound((r) => r + 1)}
      />
    </Stack>
  );
}

/** Says which phrases the cards come from, and nudges toward starring more while the deck is small. */
function DeckSummary({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Stack gap={4}>
      <Group gap="xs" className={classes.summary}>
        <IconStar size={18} stroke={1.8} aria-hidden="true" />
        <Text fw={600}>
          Your deck: {count} starred {count === 1 ? "phrase" : "phrases"}
        </Text>
      </Group>
      {count < SMALL_DECK && (
        <Text size="sm" c="dimmed">
          Small deck so far. Star more translations and they will join it.
        </Text>
      )}
    </Stack>
  );
}

const SMALL_DECK = 5;

function PracticeLanguage({
  languages,
  value,
  onChange,
}: {
  languages: ProfileLanguage[];
  value: Lang;
  onChange: (lang: Lang) => void;
}) {
  return (
    <Stack gap={4}>
      <Text size="sm" c="dimmed">
        Practice in
      </Text>
      {/* Scrolls inside the row instead of widening the page on a phone. */}
      <Box
        style={{ overflowX: "auto", maxWidth: "100%", scrollbarWidth: "none" }}
      >
        <SegmentedControl
          aria-label="Practice in"
          value={value}
          onChange={(next) => onChange(next as Lang)}
          data={languages.map(({ lang, region }) => ({
            value: lang,
            label: <LangLabel lang={lang} region={region} showRegion={false} />,
          }))}
        />
      </Box>
    </Stack>
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
  profileLangs,
  random,
  onRestart,
}: {
  groups: PhraseGroupDTO[];
  practice: Lang;
  profileLangs: Lang[];
  random?: () => number;
  onRestart: () => void;
}) {
  const [built] = useState(() => buildCards(groups, practice, profileLangs));
  const [session] = useState(() => new ReviewSession(built.cards, random));
  // Plain snapshots in state: the session object mutates, React only sees new values.
  const [view, setView] = useState(() => snapshot(session));
  const [revealed, setRevealed] = useState(false);
  // Counts graded cards, so a card shown again after "Again" is dealt in afresh.
  const [step, setStep] = useState(0);

  function grade(result: "gotIt" | "again") {
    session[result]();
    setView(snapshot(session));
    setRevealed(false);
    setStep((n) => n + 1);
  }

  const skippedLine = built.skipped > 0 && (
    <Text size="sm" c="dimmed">
      {built.skipped} {built.skipped === 1 ? "phrase" : "phrases"} skipped: no{" "}
      {LANGUAGES[practice].name} version
    </Text>
  );

  if (built.cards.length === 0) {
    const noVersion = built.skipped > 0;
    return (
      <div className={classes.empty}>
        <IconStar size={32} stroke={1.8} aria-hidden="true" />
        <Title order={3}>
          {noVersion
            ? `No ${LANGUAGES[practice].name} versions yet`
            : "Your deck is empty"}
        </Title>
        <Text c="dimmed">
          {noVersion
            ? `None of your starred phrases have a ${LANGUAGES[practice].name} version. Try another language.`
            : "Practice uses the phrases you star. Translate something, tap its star, and it joins your deck."}
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
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onGrade={grade}
        />
      )}
    </Stack>
  );
}
