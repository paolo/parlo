"use client";

import { Avatar, Menu, UnstyledButton } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLogout, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { authClient } from "@/ui/auth-client";

export function UserMenu() {
  const { data } = authClient.useSession();
  const user = data?.user;

  async function signOut() {
    try {
      // better-auth reports a refusal (a rejected origin, say) as `error`, it does not throw.
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
    } catch {
      notifications.show({
        color: "red",
        title: "Couldn't sign out",
        message: "Please try again.",
      });
      return;
    }
    // A full page load, so no signed-in client state is reused and the proxy shows the landing page.
    window.location.assign("/");
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
            size={44}
          />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {user && <Menu.Label>{user.email}</Menu.Label>}
        <Menu.Item
          component={Link}
          href="/profile"
          leftSection={<IconUser size={16} />}
        >
          Profile
        </Menu.Item>
        <Menu.Item leftSection={<IconLogout size={16} />} onClick={signOut}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
