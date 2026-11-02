"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { ModuleDef } from "@/core/modules";
import { MODULE_ICONS } from "./icons";
import styles from "./AppNav.module.css";

const GROUP_LABEL: Record<string, string> = { areas: "Bereiche", later: "Demnächst", system: "" };

export function AppNav({ modules, userName }: { modules: ModuleDef[]; userName: string }) {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);
  const sidebar = modules.filter((m) => m.placement !== "tabs");
  const tabs = modules.filter((m) => m.mobileTab && m.placement !== "sidebar");
  const moreActive = !tabs.some((m) => isActive(m.href)) && !path.startsWith("/bereiche");
  const groups = ["main", "areas", "later", "system"] as const;

  return (
    <>
      <nav className={styles.sidebar} aria-label="Hauptnavigation">
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon.svg" alt="" width={32} height={32} className={styles.logo} />
          <span>Wesley</span>
        </div>
        {groups.map((g) => {
          const items = sidebar.filter((m) => (m.group ?? "main") === g);
          if (!items.length) return null;
          return (
            <div key={g} className={styles.group}>
              {GROUP_LABEL[g] && <p className={styles.groupLabel}>{GROUP_LABEL[g]}</p>}
              <ul className={styles.list}>
                {items.map((m) => {
                  const Icon = MODULE_ICONS[m.icon];
                  return (
                    <li key={m.id}>
                      {m.ready ? (
                        <Link href={m.href} className={styles.item} aria-current={isActive(m.href) ? "page" : undefined}>
                          <Icon size={20} strokeWidth={1.75} aria-hidden />
                          {m.label}
                        </Link>
                      ) : (
                        <span className={`${styles.item} ${styles.soon}`}>
                          <Icon size={20} strokeWidth={1.75} aria-hidden />
                          {m.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        <p className={styles.user}>{userName}</p>
      </nav>

      <nav className={styles.tabbar} aria-label="Hauptnavigation">
        {tabs.map((m) => {
          const Icon = MODULE_ICONS[m.icon];
          return (
            <Link key={m.id} href={m.href} className={styles.tab} aria-current={isActive(m.href) ? "page" : undefined}>
              <Icon size={22} strokeWidth={1.75} aria-hidden />
              <span>{m.label}</span>
            </Link>
          );
        })}
        <Link href="/mehr" className={styles.tab} aria-current={moreActive ? "page" : undefined}>
          <Menu size={22} strokeWidth={1.75} aria-hidden />
          <span>Mehr</span>
        </Link>
      </nav>
    </>
  );
}
