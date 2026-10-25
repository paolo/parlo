"use client";

import { IconBook, IconHistory, IconLanguage } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classes from "./NavLinks.module.css";

const links = [
  { href: "/", label: "Translate", icon: IconLanguage },
  { href: "/history", label: "History", icon: IconHistory },
  { href: "/phrasebook", label: "Phrasebook", icon: IconBook },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return links.map(({ href, label, icon: Icon }) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={classes.link}
        data-active={active || undefined}
        aria-current={active ? "page" : undefined}
      >
        <Icon size={22} stroke={1.8} aria-hidden="true" />
        <span>{label}</span>
      </Link>
    );
  });
}
