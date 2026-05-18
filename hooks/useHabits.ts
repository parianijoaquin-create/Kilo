"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Habit, HabitLog, HabitLogStatus } from "@/types";

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("habits")
        .select(`
          id, user_id, code, title, target_value, target_unit, frequency, is_active, created_at,
          habit_logs!left ( id, habit_id, user_id, logged_at, log_date, value, status, note, created_at )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        setHabits((data as unknown as Habit[]) ?? []);
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const toggleHabit = useCallback(async (habitId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return { error: "Hábito no encontrado" };

    const existingLog = habit.habit_logs?.find((l: HabitLog) => l.log_date === today);

    if (existingLog) {
      const newStatus: HabitLogStatus = existingLog.status === "done" ? "skipped" : "done";
      const { error } = await supabase
        .from("habit_logs")
        .update({ status: newStatus })
        .eq("id", existingLog.id);

      if (!error) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  habit_logs: h.habit_logs?.map((l: HabitLog) =>
                    l.id === existingLog.id ? { ...l, status: newStatus } : l
                  ),
                }
              : h
          )
        );
      }
      return { error: error?.message ?? null };
    } else {
      const { data: newLog, error } = await supabase
        .from("habit_logs")
        .insert({ habit_id: habitId, user_id: user.id, logged_at: new Date().toISOString(), status: "done" })
        .select()
        .single();

      if (!error && newLog) {
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? { ...h, habit_logs: [...(h.habit_logs ?? []), newLog as HabitLog] }
              : h
          )
        );
      }
      return { error: error?.message ?? null };
    }
  }, [habits, today]);

  const createHabit = useCallback(async (habit: Partial<Habit>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data, error } = await supabase
      .from("habits")
      .insert({ ...habit, user_id: user.id, is_active: true })
      .select()
      .single();

    if (!error && data) setHabits((prev) => [...prev, data as Habit]);
    return { error: error?.message ?? null };
  }, []);

  return { habits, loading, error, toggleHabit, createHabit };
}
