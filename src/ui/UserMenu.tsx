"use client";

import { Avatar, Menu, UnstyledButton } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/ui/auth-client";

export function UserMenu() {
  const router = useRouter();
  const { data } = authClient.useSession();
  const user = data?.user;

  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <UnstyledButton aria-label="Account menu">
          <Avatar
            src={user?.image}
            name={user?.name}
            color="initials"
            radius="xl"
            size="md"
          />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {user && <Menu.Label>{user.email}</Menu.Label>}
        <Menu.Item leftSection={<IconLogout size={16} />} onClick={signOut}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
