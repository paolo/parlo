import { ComingNext } from "@/ui/ComingNext";

export default function ProfilePage() {
  return (
    <ComingNext
      title="Profile"
      intro="Tell Parlo how well you know each language, so corrections and notes are explained at your level. Until then, everyone is treated as intermediate in all three."
      items={[
        "Set your level per language: native, advanced, intermediate or beginner",
        "Explanations come in your strongest language, pitched to your level in the phrase's language",
        "See today's usage and when your quota resets",
      ]}
    />
  );
}
