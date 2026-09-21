"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { readCache, userCacheKey, writeCache, useIsoLayoutEffect } from "@/lib/localCache";

export interface WeightEntry {
  id: string;
  weight_kg: number;
  logged_at: string;
  note: string | null;
}

export function useWeightLog() {
  const { userId, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const savingRef = useRef(false);
  const cacheKey = userId ? userCacheKey(userId, "weight-history") : null;

  const commitHistory = useCallback((updater: WeightEntry[] | ((prev: WeightEntry[]) => WeightEntry[])) => {
    setHistory((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (cacheKey) writeCache(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  useIsoLayoutEffect(() => {
    if (!cacheKey) return;
    const cached = readCache<WeightEntry[]>(cacheKey);
    if (cached) {
      setHistory(cached);
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) return;

    let cancelled = false;

    async function load() {
      const { data, error: loadError } = await supabase
        .from("weight_logs")
        .select("id, weight_kg, logged_at, note")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(30);

      if (!cancelled) {
        if (!loadError) commitHistory((data as WeightEntry[]) ?? []);
        setError(loadError?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading, commitHistory]);

  const logWeight = useCallback(async (weight_kg: number, note?: string) => {
    if (savingRef.current) return { error: "Ya se está guardando" };
    if (!weight_kg || weight_kg <= 0) return { error: "Peso inválido" };

    if (!userId) return { error: "No autenticado" };

    savingRef.current = true;
    setSaving(true);

    const { data: newEntry, error: insertErr } = await supabase
      .from("weight_logs")
      .insert({
        user_id: userId,
        weight_kg,
        logged_at: new Date().toISOString(),
        note: note ?? null,
      })
      .select("id, weight_kg, logged_at, note")
      .single();

    if (insertErr) {
      setError(insertErr.message);
      savingRef.current = false;
      setSaving(false);
      return { error: insertErr.message };
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ current_weight_kg: weight_kg, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileErr) {
      await supabase.from("weight_logs").delete().eq("id", (newEntry as WeightEntry).id);
      setError(profileErr.message);
      savingRef.current = false;
      setSaving(false);
      return { error: profileErr.message };
    }

    commitHistory((prev) => [newEntry as WeightEntry, ...prev]);
    setError(null);

    savingRef.current = false;
    setSaving(false);
    return { error: null };
  }, [supabase, userId, commitHistory]);

  const latestWeight = history[0]?.weight_kg ?? null;
  const sparkData = history.slice(0, 7).map((e) => e.weight_kg).reverse();

  return { history, loading: authLoading || (!!userId && loading), saving, error, logWeight, latestWeight, sparkData };
}
