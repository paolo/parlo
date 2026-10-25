"use client";

import {
  Alert,
  Button,
  Group,
  List,
  Loader,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { errorMessage } from "../errors";
import { LangLabel } from "../LangLabel";
import { useAllFavorites, useProfile } from "../queries";
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
  return (
    <Stack gap="lg" maw={720}>
      <PracticeLanguage
        languages={languages}
        value={practice}
        onChange={(lang) => {
          setChosen(lang);
          setRound((r) => r + 1);
        }}
      />
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
      <SegmentedControl
        aria-label="Practice in"
        value={value}
        onChange={(next) => onChange(next as Lang)}
        data={languages.map(({ lang, region }) => ({
          value: lang,
          label: <LangLabel lang={lang} region={region} />,
        }))}
      />
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

  function grade(result: "gotIt" | "again") {
    session[result]();
    setView(snapshot(session));
    setRevealed(false);
  }

  const skippedLine = built.skipped > 0 && (
    <Text size="sm" c="dimmed">
      {built.skipped} {built.skipped === 1 ? "phrase" : "phrases"} skipped: no{" "}
      {LANGUAGES[practice].name} version
    </Text>
  );

  if (built.cards.length === 0) {
    return (
      <Stack align="flex-start" gap="xs">
        <Text c="dimmed">
          {built.skipped > 0
            ? `None of your starred phrases have a ${LANGUAGES[practice].name} version. Try another language.`
            : "Nothing to review yet. Star some translations first."}
        </Text>
        {skippedLine}
        <Button component={Link} href="/">
          Go to Translate
        </Button>
      </Stack>
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
        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            <Text
              size="xl"
              fw={700}
              dir="auto"
              style={{ fontFamily: "var(--parlo-font-display)" }}
            >
              {card.front.text}
            </Text>
            {revealed ? (
              <>
                <Stack gap="xs">
                  {card.back.map((phrase) => (
                    <div key={phrase.lang}>
                      <Text size="xs" c="dimmed">
                        <LangLabel lang={phrase.lang} />
                      </Text>
                      <Text dir="auto">{phrase.text}</Text>
                    </div>
                  ))}
                </Stack>
                <Group>
                  <Button onClick={() => grade("gotIt")}>Got it</Button>
                  <Button variant="default" onClick={() => grade("again")}>
                    Again
                  </Button>
                </Group>
              </>
            ) : (
              <Group>
                <Button onClick={() => setRevealed(true)}>Reveal</Button>
              </Group>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
