"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

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
  const supabase = useMemo(() => createClient(), []);
  const savingRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("weight_logs")
        .select("id, weight_kg, logged_at, note")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(30);

      if (!cancelled) {
        setHistory((data as WeightEntry[]) ?? []);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading]);

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
      savingRef.current = false;
      setSaving(false);
      return { error: insertErr.message };
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ current_weight_kg: weight_kg, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileErr) {
      savingRef.current = false;
      setSaving(false);
      return { error: profileErr.message };
    }

    setHistory((prev) => [newEntry as WeightEntry, ...prev]);

    savingRef.current = false;
    setSaving(false);
    return { error: null };
  }, [supabase, userId]);

  const latestWeight = history[0]?.weight_kg ?? null;
  const sparkData = history.slice(0, 7).map((e) => e.weight_kg).reverse();

  return { history, loading, saving, logWeight, latestWeight, sparkData };
}
