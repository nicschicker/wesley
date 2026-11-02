/**
 * Zentrale Modul-Registry. Ein neues Modul bekommt hier einen Eintrag
 * und erscheint damit automatisch in der Navigation.
 *
 * `ready: false` blendet Module aus, die noch nicht gebaut sind.
 * `mobileTab: true` = eines der vier Ziele der mobilen Tab-Leiste.
 */
export type ModuleDef = {
  id: string;
  label: string;
  href: string;
  icon: "today" | "tasks" | "calendar" | "anniversaries" | "news" | "restaurants" | "settings" | "admin";
  ready: boolean;
  mobileTab: boolean;
  adminOnly?: boolean;
};

export const MODULES: ModuleDef[] = [
  { id: "today", label: "Heute", href: "/heute", icon: "today", ready: true, mobileTab: true },
  { id: "tasks", label: "Tasks", href: "/tasks", icon: "tasks", ready: false, mobileTab: true },
  { id: "calendar", label: "Kalender", href: "/kalender", icon: "calendar", ready: false, mobileTab: true },
  { id: "anniversaries", label: "Jahrestage", href: "/jahrestage", icon: "anniversaries", ready: false, mobileTab: false },
  { id: "news", label: "News", href: "/news", icon: "news", ready: false, mobileTab: false },
  { id: "restaurants", label: "Restaurants", href: "/restaurants", icon: "restaurants", ready: false, mobileTab: false },
  { id: "settings", label: "Einstellungen", href: "/einstellungen", icon: "settings", ready: true, mobileTab: false },
  { id: "admin", label: "Admin", href: "/admin", icon: "admin", ready: true, mobileTab: false, adminOnly: true },
];

export function visibleModules(isAdmin: boolean): ModuleDef[] {
  return MODULES.filter((m) => !m.adminOnly || isAdmin);
}
