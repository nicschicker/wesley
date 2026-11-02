import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import type { Task } from "./model";

export type Area = {
  id: string;
  slug: string;
  name: string;
  kind: "tasks" | "sport" | "money";
  sort_mode: "priority" | "module";
  sort: number;
};

export type Goal = {
  id: string;
  area_id: string;
  title: string;
  notes: string;
  target_date: string | null;
  progress: number;
  status: "active" | "achieved" | "dropped";
  created_at: string;
};

const TASK_FIELDS =
  "id, area_id, title, notes, kind, status, priority, due_date, recurrence, module, completed_at, created_at";

export async function listAreas(): Promise<Area[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("areas").select("id, slug, name, kind, sort_mode, sort").order("sort");
  return (data ?? []) as Area[];
}

export async function getAreaBySlug(slug: string): Promise<Area> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("areas")
    .select("id, slug, name, kind, sort_mode, sort")
    .eq("slug", slug)
    .maybeSingle();
  if (!data || data.kind !== "tasks") notFound();
  return data as Area;
}

/** Offene Tasks plus die letzten 30 erledigten eines Bereichs (oder aller Bereiche). */
export async function listTasks(areaId?: string): Promise<Task[]> {
  const supabase = await createClient();
  let open = supabase.from("tasks").select(TASK_FIELDS).eq("archived", false).neq("status", "done");
  let done = supabase
    .from("tasks")
    .select(TASK_FIELDS)
    .eq("archived", false)
    .eq("status", "done")
    .order("completed_at", { ascending: false })
    .limit(30);
  if (areaId) {
    open = open.eq("area_id", areaId);
    done = done.eq("area_id", areaId);
  }
  const [a, b] = await Promise.all([open, done]);
  return [...((a.data ?? []) as Task[]), ...((b.data ?? []) as Task[])];
}

/** IDs der wiederkehrenden Tasks, die an diesem Tag abgehakt wurden. */
export async function completedOn(day: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("task_completions").select("task_id").eq("day", day);
  return new Set((data ?? []).map((r) => r.task_id as string));
}

export async function listGoals(areaId: string): Promise<Goal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("id, area_id, title, notes, target_date, progress, status, created_at")
    .eq("area_id", areaId)
    .order("status")
    .order("target_date", { ascending: true, nullsFirst: false });
  return (data ?? []) as Goal[];
}
