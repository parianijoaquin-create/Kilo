"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ReminderKind = "meal" | "water" | "habit" | "weight" | "custom";

export interface Reminder {
  id: string;
  user_id: string;
  kind: ReminderKind;
  label: string;
  time_of_day: string; // "HH:MM:SS"
  days_of_week: number[]; // 1=Mon..7=Sun
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error: err } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id)
        .order("time_of_day", { ascending: true });

      if (!cancelled) {
        setReminders((data as Reminder[]) ?? []);
        setError(err?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const createReminder = useCallback(async (payload: Omit<Reminder, "id" | "user_id" | "created_at" | "updated_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data, error: err } = await supabase
      .from("reminders")
      .insert({ ...payload, user_id: user.id })
      .select()
      .single();

    if (!err && data) setReminders((prev) => [...prev, data as Reminder]);
    return { error: err?.message ?? null };
  }, []);

  const updateReminder = useCallback(async (id: string, patch: Partial<Reminder>) => {
    const { data, error: err } = await supabase
      .from("reminders")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (!err && data) {
      setReminders((prev) => prev.map((r) => (r.id === id ? (data as Reminder) : r)));
    }
    return { error: err?.message ?? null };
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("reminders").delete().eq("id", id);
    if (!err) setReminders((prev) => prev.filter((r) => r.id !== id));
    return { error: err?.message ?? null };
  }, []);

  return { reminders, loading, error, createReminder, updateReminder, deleteReminder };
}
