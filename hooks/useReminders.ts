"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { readCache, userCacheKey, writeCache, useIsoLayoutEffect } from "@/lib/localCache";

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
  const cacheKey = userId ? userCacheKey(userId, "reminders") : null;

  const commitReminders = useCallback((updater: Reminder[] | ((prev: Reminder[]) => Reminder[])) => {
    setReminders((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (cacheKey) writeCache(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  useIsoLayoutEffect(() => {
    if (!cacheKey) return;
    const cached = readCache<Reminder[]>(cacheKey);
    if (cached) {
      setReminders(cached);
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) return;

    let cancelled = false;

    async function load() {
      const { data, error: err } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("time_of_day", { ascending: true });

      if (!cancelled) {
        if (!err) commitReminders((data as Reminder[]) ?? []);
        setError(err?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading, commitReminders]);

  const createReminder = useCallback(async (payload: Omit<Reminder, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!userId) return { error: "No autenticado" };

    const { data, error: err } = await supabase
      .from("reminders")
      .insert({ ...payload, user_id: userId })
      .select()
      .single();

    if (!err && data) commitReminders((prev) => [...prev, data as Reminder]);
    setError(err?.message ?? null);
    return { error: err?.message ?? null };
  }, [supabase, userId, commitReminders]);

  const updateReminder = useCallback(async (id: string, patch: Partial<Reminder>) => {
    const { data, error: err } = await supabase
      .from("reminders")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (!err && data) {
      commitReminders((prev) => prev.map((r) => (r.id === id ? (data as Reminder) : r)));
    }
    setError(err?.message ?? null);
    return { error: err?.message ?? null };
  }, [supabase, commitReminders]);

  const deleteReminder = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("reminders").delete().eq("id", id);
    if (!err) commitReminders((prev) => prev.filter((r) => r.id !== id));
    setError(err?.message ?? null);
    return { error: err?.message ?? null };
  }, [supabase, commitReminders]);

  return { reminders, loading: authLoading || (!!userId && loading), error, createReminder, updateReminder, deleteReminder };
}
