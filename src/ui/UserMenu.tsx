"use client";

import { Avatar, Menu, UnstyledButton } from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { authClient } from "@/ui/auth-client";
import { useUsage } from "./queries";
import { signOut } from "./signOut";
import { UsageRing } from "./UsageRing";
import { UsageSummary } from "./UsageSummary";
import { meterState } from "./usageMeter";

export function UserMenu() {
  const { data } = authClient.useSession();
  const user = data?.user;
  const usage = useUsage().data;
  const left = usage && meterState(usage.usedToday, usage.dailyLimit).remaining;

  const avatar = (
    <Avatar
      src={user?.image}
      name={user?.name}
      color="initials"
      radius="xl"
      size={44}
    />
  );

  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <UnstyledButton
          aria-label={
            left === undefined
              ? "Account menu"
              : `Account menu, ${left} translations left today`
          }
        >
          {usage ? (
            <UsageRing used={usage.usedToday} limit={usage.dailyLimit}>
              {avatar}
            </UsageRing>
          ) : (
            avatar
          )}
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {user && <Menu.Label>{user.email}</Menu.Label>}
        {usage && (
          <UsageSummary
            used={usage.usedToday}
            limit={usage.dailyLimit}
            resetAt={usage.resetAt}
          />
        )}
        <Menu.Divider />
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
