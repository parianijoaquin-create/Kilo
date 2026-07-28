"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

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
  const { userId, loading: authLoading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      const { data, error: err } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("time_of_day", { ascending: true });

      if (!cancelled) {
        setReminders((data as Reminder[]) ?? []);
        setError(err?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading]);

  const createReminder = useCallback(async (payload: Omit<Reminder, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return { error: "No autenticado" };

    const { data, error: err } = await supabase
      .from("reminders")
      .insert({ ...payload, user_id: userId })
      .select()
      .single();

    if (!err && data) setReminders((prev) => [...prev, data as Reminder]);
    return { error: err?.message ?? null };
  }, [supabase, userId]);

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
