"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/core/auth/session";
import { createClient } from "@/core/supabase/server";
import { todayISO } from "@/core/date";
import { parseRecurrence } from "./model";

// Alle Aktionen laufen im Namen der Person: Row Level Security schützt fremde Daten.

const uuid = z.string().uuid();
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .or(z.literal("").transform(() => null));

function refresh() {
  revalidatePath("/", "layout");
}

function text(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export type ActionState = { error?: string; ok?: boolean };

const taskSchema = z.object({
  title: z.string().min(1, "Bitte einen Titel eingeben.").max(200, "Der Titel ist zu lang (max. 200 Zeichen)."),
  notes: z.string().max(4000),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["open", "in_progress", "waiting", "done"]),
  due_date: optionalDate,
  module: z.string().max(60),
});

function readTask(fd: FormData) {
  return taskSchema.safeParse({
    title: text(fd, "title"),
    notes: text(fd, "notes"),
    priority: text(fd, "priority") || "medium",
    status: text(fd, "status") || "open",
    due_date: text(fd, "due_date") || null,
    module: text(fd, "module"),
  });
}

export async function createTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const areaId = uuid.safeParse(fd.get("area_id"));
  const parsed = readTask(fd);
  if (!areaId.success) return { error: "Bereich fehlt." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const recurrence = parseRecurrence(text(fd, "freq"), fd.getAll("weekdays").map(String), text(fd, "month_day"));
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    area_id: areaId.data,
    ...parsed.data,
    status: recurrence ? "open" : parsed.data.status,
    kind: recurrence ? "recurring" : "one_off",
    recurrence,
    due_date: recurrence ? null : parsed.data.due_date,
  });
  if (error) return { error: "Der Task konnte nicht gespeichert werden." };
  refresh();
  return { ok: true };
}

export async function updateTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = uuid.safeParse(fd.get("id"));
  const parsed = readTask(fd);
  if (!id.success) return { error: "Task nicht gefunden." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const recurrence = parseRecurrence(text(fd, "freq"), fd.getAll("weekdays").map(String), text(fd, "month_day"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      ...parsed.data,
      kind: recurrence ? "recurring" : "one_off",
      recurrence,
      due_date: recurrence ? null : parsed.data.due_date,
      completed_at: parsed.data.status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id.data);
  if (error) return { error: "Die Änderung konnte nicht gespeichert werden." };
  refresh();
  return { ok: true };
}

/** Status direkt aus der Liste ändern. */
export async function setTaskStatus(fd: FormData) {
  await requireUser();
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["open", "in_progress", "waiting", "done"]).parse(fd.get("status"));
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", id);
  refresh();
}

/** Abhaken: einmalige Tasks erledigt/offen, Routinen für heute abhaken/zurücksetzen. */
export async function toggleTask(fd: FormData) {
  const user = await requireUser();
  const id = uuid.parse(fd.get("id"));
  const supabase = await createClient();
  const { data: task } = await supabase.from("tasks").select("kind, status").eq("id", id).single();
  if (!task) return;

  if (task.kind === "recurring") {
    const day = todayISO();
    const { data: existing } = await supabase
      .from("task_completions")
      .select("task_id")
      .eq("task_id", id)
      .eq("day", day)
      .maybeSingle();
    if (existing) {
      await supabase.from("task_completions").delete().eq("task_id", id).eq("day", day);
    } else {
      await supabase.from("task_completions").insert({ task_id: id, user_id: user.id, day });
    }
  } else {
    const done = task.status !== "done";
    await supabase
      .from("tasks")
      .update({ status: done ? "done" : "open", completed_at: done ? new Date().toISOString() : null })
      .eq("id", id);
  }
  refresh();
}

export async function deleteTask(fd: FormData) {
  await requireUser();
  const id = uuid.parse(fd.get("id"));
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  refresh();
}

// ---------- Ziele ----------

const goalSchema = z.object({
  title: z.string().min(1, "Bitte einen Titel eingeben.").max(160),
  notes: z.string().max(4000),
  target_date: optionalDate,
  progress: z.coerce.number().int().min(0).max(100),
  status: z.enum(["active", "achieved", "dropped"]),
});

function readGoal(fd: FormData) {
  return goalSchema.safeParse({
    title: text(fd, "title"),
    notes: text(fd, "notes"),
    target_date: text(fd, "target_date") || null,
    progress: text(fd, "progress") || 0,
    status: text(fd, "status") || "active",
  });
}

export async function createGoal(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const areaId = uuid.safeParse(fd.get("area_id"));
  const parsed = readGoal(fd);
  if (!areaId.success) return { error: "Bereich fehlt." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({ user_id: user.id, area_id: areaId.data, ...parsed.data });
  if (error) return { error: "Das Ziel konnte nicht gespeichert werden." };
  refresh();
  return { ok: true };
}

export async function updateGoal(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireUser();
  const id = uuid.safeParse(fd.get("id"));
  const parsed = readGoal(fd);
  if (!id.success) return { error: "Ziel nicht gefunden." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("goals").update(parsed.data).eq("id", id.data);
  if (error) return { error: "Die Änderung konnte nicht gespeichert werden." };
  refresh();
  return { ok: true };
}

export async function deleteGoal(fd: FormData) {
  await requireUser();
  const id = uuid.parse(fd.get("id"));
  const supabase = await createClient();
  await supabase.from("goals").delete().eq("id", id);
  refresh();
}
