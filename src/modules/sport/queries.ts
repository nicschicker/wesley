import "server-only";
import { createClient } from "@/core/supabase/server";
import type { SetRow } from "./stats";

export type Exercise = { id: string; name: string };

export type WorkoutView = {
  id: string;
  day: string;
  note: string;
  exercises: { exerciseId: string; name: string; sets: { set_no: number; reps: number; weight_kg: number | null }[] }[];
};

export async function listExercises(): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("exercises").select("id, name").order("name");
  return (data ?? []) as Exercise[];
}

export async function listWorkouts(limit = 15): Promise<WorkoutView[]> {
  const supabase = await createClient();
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id, day, note, created_at")
    .order("day", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!workouts?.length) return [];

  const { data: sets } = await supabase
    .from("workout_sets")
    .select("workout_id, exercise_id, position, set_no, reps, weight_kg, exercises(name)")
    .in("workout_id", workouts.map((w) => w.id))
    .order("position")
    .order("set_no");

  return workouts.map((w) => {
    const own = (sets ?? []).filter((s) => s.workout_id === w.id);
    // Ein Block pro Position im Training (dieselbe Übung kann zweimal vorkommen)
    type Block = WorkoutView["exercises"][number];
    const blocks = new Map<number, Block>();
    for (const s of own) {
      const name = (s.exercises as unknown as { name: string } | null)?.name ?? "Übung";
      const block: Block = blocks.get(s.position) ?? { exerciseId: s.exercise_id, name, sets: [] };
      block.sets.push({ set_no: s.set_no, reps: s.reps, weight_kg: s.weight_kg === null ? null : Number(s.weight_kg) });
      blocks.set(s.position, block);
    }
    return { id: w.id, day: w.day, note: w.note, exercises: [...blocks.entries()].sort(([a], [b]) => a - b).map(([, b]) => b) };
  });
}

/** Alle Sätze einer Übung mit Trainingsdatum (für den Fortschritt). */
export async function exerciseSets(exerciseId: string): Promise<SetRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sets")
    .select("reps, weight_kg, workouts(day)")
    .eq("exercise_id", exerciseId)
    .limit(2000);
  return (data ?? []).map((r) => ({
    day: (r.workouts as unknown as { day: string } | null)?.day ?? "",
    reps: r.reps,
    weight_kg: r.weight_kg === null ? null : Number(r.weight_kg),
  })).filter((r) => r.day);
}

/** Übungen, die schon mindestens einmal trainiert wurden. */
export async function trainedExerciseIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("workout_sets").select("exercise_id").limit(5000);
  return new Set((data ?? []).map((r) => r.exercise_id as string));
}
