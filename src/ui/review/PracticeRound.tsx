import { Button, Group, List, Stack, Text, Title } from "@mantine/core";
import { IconStar } from "@tabler/icons-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import type { PhraseGroupDTO } from "@/server/phrases/types";
import type { ProfileLanguage } from "@/server/profile/types";
import { LANGUAGES, type Lang } from "../../shared/languages";
import { PracticeDeck } from "./PracticeDeck";
import { RevealPanel, TypedPanel } from "./PracticePanels";
import type { Source } from "./prefs";
import classes from "./ReviewView.module.css";
import { buildCards, pickRandom, ReviewSession } from "./session";

function snapshot(session: ReviewSession) {
  return {
    current: session.current,
    finished: session.finished,
    done: session.done,
    total: session.total,
    summary: session.summary(),
  };
}

/**
 * One round of cards: deals `count` of `groups` at random, then grades them until none is left. It needs no
 * account: the viewer's languages come in as `languages` (profile order, each with its region), and with
 * `favorites` off the cards carry no star, so a round can run signed out and without a single request.
 */
export function PracticeRound({
  groups,
  source,
  count,
  practice,
  answerLang,
  languages,
  favorites,
  random,
  onRestart,
  onUseStarter,
  finishedFooter,
}: {
  groups: PhraseGroupDTO[];
  source: Source;
  /** How many cards to deal, drawn at random; fewer when the source has fewer. */
  count: number;
  practice: Lang;
  /** Set when practicing by typing: the language of the phrase to write. */
  answerLang?: Lang;
  /** The viewer's languages in profile order. */
  languages: ProfileLanguage[];
  /** Whether the cards can be starred; needs an account. */
  favorites: boolean;
  random?: () => number;
  onRestart: () => void;
  /** Offered when the deck is empty; without it that screen has no buttons. */
  onUseStarter?: () => void;
  /** Shown under the Done summary, e.g. an invitation to sign up. */
  finishedFooter?: ReactNode;
}) {
  const profileLangs = languages.map((l) => l.lang);
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
        {onUseStarter && (
          <Group gap="sm">
            <Button onClick={onUseStarter}>Use Starter</Button>
            <Button component={Link} href="/translate" variant="default">
              Go to Translate
            </Button>
          </Group>
        )}
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
        {/* With a footer, the footer holds the screen's one primary action. */}
        <Button
          size="lg"
          fullWidth
          variant={finishedFooter ? "default" : "filled"}
          onClick={onRestart}
        >
          Practice again
        </Button>
        {finishedFooter}
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
          region={languages.find((l) => l.lang === practice)?.region}
          favorite={favorites}
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
