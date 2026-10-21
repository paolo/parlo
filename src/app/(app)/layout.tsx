import { AppLayout } from "@/ui/AppLayout";

export default function AuthenticatedLayout({ children }: LayoutProps<"/">) {
  return <AppLayout>{children}</AppLayout>;
}
