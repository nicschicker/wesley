"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, CheckSquare, Gift, Menu, Newspaper, Settings, ShieldCheck, Sun, UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { ModuleDef } from "@/core/modules";
import styles from "./AppNav.module.css";

const ICONS: Record<ModuleDef["icon"], LucideIcon> = {
  today: Sun,
  tasks: CheckSquare,
  calendar: CalendarDays,
  anniversaries: Gift,
  news: Newspaper,
  restaurants: UtensilsCrossed,
  settings: Settings,
  admin: ShieldCheck,
};

export function AppNav({ modules, userName }: { modules: ModuleDef[]; userName: string }) {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);
  const tabs = modules.filter((m) => m.mobileTab);
  const moreActive = !tabs.some((m) => isActive(m.href));

  return (
    <>
      {/* Seitenleiste ab 900 px */}
      <nav className={styles.sidebar} aria-label="Hauptnavigation">
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon.svg" alt="" width={32} height={32} className={styles.logo} />
          <span>Wesley</span>
        </div>
        <ul className={styles.list}>
          {modules.map((m) => {
            const Icon = ICONS[m.icon];
            return (
              <li key={m.id}>
                {m.ready ? (
                  <Link href={m.href} className={styles.item} aria-current={isActive(m.href) ? "page" : undefined}>
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                    {m.label}
                  </Link>
                ) : (
                  <span className={`${styles.item} ${styles.soon}`} title="Kommt im nächsten Schritt">
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                    {m.label}
                    <span className={styles.badge}>bald</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className={styles.user}>{userName}</p>
      </nav>

      {/* Tab-Leiste mobil */}
      <nav className={styles.tabbar} aria-label="Hauptnavigation">
        {tabs.map((m) => {
          const Icon = ICONS[m.icon];
          const content = (
            <>
              <Icon size={22} strokeWidth={1.75} aria-hidden />
              <span>{m.label}</span>
            </>
          );
          return m.ready ? (
            <Link key={m.id} href={m.href} className={styles.tab} aria-current={isActive(m.href) ? "page" : undefined}>
              {content}
            </Link>
          ) : (
            <span key={m.id} className={`${styles.tab} ${styles.soon}`}>{content}</span>
          );
        })}
        <Link href="/einstellungen" className={styles.tab} aria-current={moreActive ? "page" : undefined}>
          <Menu size={22} strokeWidth={1.75} aria-hidden />
          <span>Mehr</span>
        </Link>
      </nav>
    </>
  );
}
