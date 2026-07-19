"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToday } from "@/hooks/useToday";
import { useAuth } from "@/context/AuthContext";
import type { Habit, HabitLog, HabitLogStatus } from "@/types";

export function useHabits() {
  const { userId, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const today = useToday();

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("habits")
        .select(`
          id, user_id, code, title, target_value, target_unit, frequency, is_active, created_at,
          habit_logs!left ( id, habit_id, user_id, logged_at, log_date, value, status, note, created_at )
        `)
        .eq("user_id", userId)
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
  }, [supabase, userId, authLoading]);

  const toggleHabit = useCallback(async (habitId: string) => {
    if (!userId) return { error: "No autenticado" };

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
        .insert({ habit_id: habitId, user_id: userId, logged_at: new Date().toISOString(), status: "done" })
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
  }, [supabase, userId, habits, today]);

  const createHabit = useCallback(async (habit: Partial<Habit>) => {
    if (!userId) return { error: "No autenticado" };

    const payload = {
      title: habit.title,
      code: habit.code,
      target_value: habit.target_value,
      target_unit: habit.target_unit,
      frequency: habit.frequency ?? "daily",
      user_id: userId,
      is_active: true,
    };

    const { data, error } = await supabase
      .from("habits")
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      setHabits((prev) => [...prev, { ...(data as Habit), habit_logs: [] }]);
    }
    return { error: error?.message ?? null };
  }, [supabase, userId]);

  const deleteHabit = useCallback(async (habitId: string) => {
    const { error } = await supabase
      .from("habits")
      .update({ is_active: false })
      .eq("id", habitId);

    if (!error) setHabits((prev) => prev.filter((h) => h.id !== habitId));
    return { error: error?.message ?? null };
  }, []);

  const updateHabit = useCallback(async (
    habitId: string,
    updates: { title?: string; target_value?: number | null; target_unit?: string | null },
  ) => {
    const { data, error } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", habitId)
      .select()
      .single();

    if (!error && data) {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, ...(data as Habit) } : h))
      );
    }
    return { error: error?.message ?? null };
  }, []);

  return { habits, loading, error, toggleHabit, createHabit, deleteHabit, updateHabit };
}
