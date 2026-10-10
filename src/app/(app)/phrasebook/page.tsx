import { ComingNext } from "@/ui/ComingNext";

export default function PhrasebookPage() {
  return (
    <ComingNext
      title="Phrasebook"
      intro="Your personal collection of the phrases worth keeping."
      items={[
        "Star any translation to add it here",
        "Search across all three languages at once",
        "Later: review them with spaced repetition",
      ]}
    />
  );
}
