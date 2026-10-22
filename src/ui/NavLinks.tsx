"use client";

import { NavLink } from "@mantine/core";
import { IconBook, IconHistory, IconLanguage } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Translate", icon: IconLanguage },
  { href: "/history", label: "History", icon: IconHistory },
  { href: "/phrasebook", label: "Phrasebook", icon: IconBook },
] as const;

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return links.map(({ href, label, icon: Icon }) => (
    <NavLink
      key={href}
      component={Link}
      href={href}
      label={label}
      leftSection={<Icon size={18} stroke={1.5} />}
      active={pathname === href}
      onClick={onNavigate}
    />
  ));
}
