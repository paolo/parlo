import { ProfileGate } from "@/ui/profile/ProfileGate";
import { ProfileView } from "@/ui/profile/ProfileView";

export default function ProfilePage() {
  return (
    <ProfileGate>
      <ProfileView />
    </ProfileGate>
  );
}
