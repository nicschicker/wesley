"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/core/auth/session";
import { createClient } from "@/core/supabase/server";

export type SportState = { error?: string; ok?: boolean };

const workoutSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte ein Datum wählen."),
  note: z.string().max(500),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid("Bitte bei jeder Übung eine Übung auswählen."),
        sets: z
          .array(
            z.object({
              reps: z.number().int().min(0).max(1000),
              weight: z.number().min(0).max(1000).nullable(),
            }),
          )
          .min(1, "Jede Übung braucht mindestens einen Satz.")
          .max(50),
      }),
    )
    .min(1, "Bitte mindestens eine Übung erfassen.")
    .max(40),
});

/** Ein Training mit allen Übungen und Sätzen speichern. */
export async function saveWorkout(_prev: SportState, fd: FormData): Promise<SportState> {
  const user = await requireUser();
  let payload: unknown;
  try {
    payload = JSON.parse(String(fd.get("payload") ?? ""));
  } catch {
    return { error: "Die Eingaben konnten nicht gelesen werden. Bitte Seite neu laden." };
  }
  const parsed = workoutSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, day: parsed.data.day, note: parsed.data.note })
    .select("id")
    .single();
  if (error || !workout) return { error: "Das Training konnte nicht gespeichert werden." };

  const rows = parsed.data.exercises.flatMap((ex, position) =>
    ex.sets.map((s, i) => ({
      user_id: user.id,
      workout_id: workout.id,
      exercise_id: ex.exerciseId,
      position,
      set_no: i + 1,
      reps: s.reps,
      weight_kg: s.weight,
    })),
  );
  const { error: setsError } = await supabase.from("workout_sets").insert(rows);
  if (setsError) {
    await supabase.from("workouts").delete().eq("id", workout.id);
    return { error: "Die Sätze konnten nicht gespeichert werden. Nichts wurde gespeichert." };
  }
  revalidatePath("/sport");
  return { ok: true };
}

export async function deleteWorkout(fd: FormData) {
  await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const supabase = await createClient();
  await supabase.from("workouts").delete().eq("id", id);
  revalidatePath("/sport");
}

export async function addExercise(_prev: SportState, fd: FormData): Promise<SportState> {
  const user = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  if (!name || name.length > 60) return { error: "Bitte einen Namen mit höchstens 60 Zeichen eingeben." };
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").insert({ user_id: user.id, name });
  if (error) return { error: error.code === "23505" ? "Diese Übung gibt es schon." : "Die Übung konnte nicht gespeichert werden." };
  revalidatePath("/sport");
  return { ok: true };
}
