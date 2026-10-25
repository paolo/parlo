"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import classes from "./AppLayout.module.css";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import { Wordmark } from "./Wordmark";

/**
 * One navigation, placed by CSS: pinned to the bottom edge on a phone, a row of pills in the header from 900px.
 * It sits inside the header so there is a single set of links in the page.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={classes.shell}>
      <header className={classes.header}>
        <div className={classes.bar}>
          <Link href="/" className={classes.home} aria-label="parlo, home">
            <Wordmark size={28} />
          </Link>
          <nav className={classes.nav} aria-label="Main">
            <NavLinks />
          </nav>
          <div className={classes.tools}>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className={classes.main}>
        <div className={classes.content}>{children}</div>
      </main>
    </div>
  );
}
