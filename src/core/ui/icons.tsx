import {
  Briefcase, CalendarDays, Dumbbell, Gift, GraduationCap, Heart, LayoutGrid, Newspaper, Settings,
  ShieldCheck, Sun, Users, UtensilsCrossed, Wallet, type LucideIcon,
} from "lucide-react";
import type { ModuleIcon } from "@/core/modules";

export const MODULE_ICONS: Record<ModuleIcon, LucideIcon> = {
  today: Sun,
  areas: LayoutGrid,
  work: Briefcase,
  school: GraduationCap,
  family: Users,
  heart: Heart,
  sport: Dumbbell,
  money: Wallet,
  calendar: CalendarDays,
  anniversaries: Gift,
  news: Newspaper,
  restaurants: UtensilsCrossed,
  settings: Settings,
  admin: ShieldCheck,
};
