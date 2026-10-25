"use client";

import { Avatar, Menu, UnstyledButton } from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { authClient } from "@/ui/auth-client";
import { signOut } from "./signOut";

export function UserMenu() {
  const { data } = authClient.useSession();
  const user = data?.user;

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
