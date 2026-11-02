/**
 * Zentrale Modul-Registry. Ein neues Modul bekommt hier einen Eintrag
 * und erscheint damit automatisch in der Navigation.
 *
 * ready: false   → noch nicht gebaut, ausgegraut mit «bald»
 * placement      → "both" (Standard), "sidebar" (nur Desktop) oder "tabs" (nur mobile Tab-Leiste)
 * mobileTab      → eines der vier Ziele der mobilen Tab-Leiste (die fünfte ist «Mehr»)
 */
export type ModuleIcon =
  | "today" | "areas" | "work" | "school" | "family" | "heart" | "sport" | "money"
  | "calendar" | "anniversaries" | "news" | "restaurants" | "settings" | "admin";

export type ModuleDef = {
  id: string;
  label: string;
  href: string;
  icon: ModuleIcon;
  ready: boolean;
  mobileTab: boolean;
  placement?: "both" | "sidebar" | "tabs";
  adminOnly?: boolean;
  group?: "main" | "areas" | "later" | "system";
};

export const MODULES: ModuleDef[] = [
  { id: "today", label: "Heute", href: "/heute", icon: "today", ready: true, mobileTab: true, group: "main" },
  { id: "areas", label: "Bereiche", href: "/bereiche", icon: "areas", ready: true, mobileTab: true, placement: "tabs", group: "main" },
  { id: "harbejt", label: "Harbejt", href: "/bereiche/harbejt", icon: "work", ready: true, mobileTab: false, placement: "sidebar", group: "areas" },
  { id: "skola", label: "Škola", href: "/bereiche/skola", icon: "school", ready: true, mobileTab: false, placement: "sidebar", group: "areas" },
  { id: "familie", label: "Familie", href: "/bereiche/familie", icon: "family", ready: true, mobileTab: false, placement: "sidebar", group: "areas" },
  { id: "freundin", label: "Freundin", href: "/bereiche/freundin", icon: "heart", ready: true, mobileTab: false, placement: "sidebar", group: "areas" },
  { id: "sport", label: "Sport", href: "/sport", icon: "sport", ready: true, mobileTab: true, group: "areas" },
  { id: "flouz", label: "Flouz", href: "/flouz", icon: "money", ready: true, mobileTab: true, group: "areas" },
  { id: "calendar", label: "Kalender", href: "/kalender", icon: "calendar", ready: false, mobileTab: false, group: "later" },
  { id: "anniversaries", label: "Jahrestage", href: "/jahrestage", icon: "anniversaries", ready: false, mobileTab: false, group: "later" },
  { id: "news", label: "News", href: "/news", icon: "news", ready: false, mobileTab: false, group: "later" },
  { id: "restaurants", label: "Restaurants", href: "/restaurants", icon: "restaurants", ready: false, mobileTab: false, group: "later" },
  { id: "settings", label: "Einstellungen", href: "/einstellungen", icon: "settings", ready: true, mobileTab: false, group: "system" },
  { id: "admin", label: "Admin", href: "/admin", icon: "admin", ready: true, mobileTab: false, adminOnly: true, group: "system" },
];

export function visibleModules(isAdmin: boolean): ModuleDef[] {
  return MODULES.filter((m) => !m.adminOnly || isAdmin);
}
