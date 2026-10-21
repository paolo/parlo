import { AppLayout } from "@/ui/AppLayout";
import { ProfileGate } from "@/ui/profile/ProfileGate";

export default function AuthenticatedLayout({ children }: LayoutProps<"/">) {
  return (
    <AppLayout>
      <ProfileGate>{children}</ProfileGate>
    </AppLayout>
  );
}
