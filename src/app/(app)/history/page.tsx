import { ComingNext } from "@/ui/ComingNext";

export default function HistoryPage() {
  return (
    <ComingNext
      title="History"
      intro="Every phrase you translate is already saved as a linked trio (Spanish, English, French), with its correction and notes. This page will let you browse them."
      items={[
        "Browse all your phrases in the language of your choice: switch between ES, EN and FR",
        "See which version you originally typed",
        "Accept a suggested correction, star a phrase, or delete it",
      ]}
    />
  );
}
