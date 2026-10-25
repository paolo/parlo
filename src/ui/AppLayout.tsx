"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import classes from "./AppLayout.module.css";
import { NavLinks } from "./NavLinks";
import { UsageBadge } from "./UsageBadge";
import { UserMenu } from "./UserMenu";
import { Wordmark } from "./Wordmark";

/**
 * Phone: a header on top and the navigation pinned to the bottom edge.
 * Desktop (900px and up): the navigation becomes a rail on the left, under the header.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={classes.shell}>
      <header className={classes.header}>
        <Link href="/" className={classes.home} aria-label="parlo, home">
          <Wordmark size={28} />
        </Link>
        <div className={classes.tools}>
          <UsageBadge />
          <UserMenu />
        </div>
      </header>
      <nav className={classes.nav} aria-label="Main">
        <NavLinks />
      </nav>
      <main className={classes.main}>
        <div className={classes.content}>{children}</div>
      </main>
    </div>
  );
}
