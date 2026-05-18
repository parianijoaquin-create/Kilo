"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export interface WeightEntry {
  id: string;
  weight_kg: number;
  logged_at: string;
  note: string | null;
}

export function useWeightLog() {
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const savingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("weight_logs")
        .select("id, weight_kg, logged_at, note")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(30);

      if (!cancelled) {
        setHistory((data as WeightEntry[]) ?? []);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const logWeight = useCallback(async (weight_kg: number, note?: string) => {
    if (savingRef.current) return { error: "Ya se está guardando" };
    if (!weight_kg || weight_kg <= 0) return { error: "Peso inválido" };

    savingRef.current = true;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      savingRef.current = false;
      setSaving(false);
      return { error: "No autenticado" };
    }

    const { data: newEntry, error: insertErr } = await supabase
      .from("weight_logs")
      .insert({
        user_id: user.id,
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
      .eq("id", user.id);

    if (profileErr) {
      savingRef.current = false;
      setSaving(false);
      return { error: profileErr.message };
    }

    setHistory((prev) => [newEntry as WeightEntry, ...prev]);

    savingRef.current = false;
    setSaving(false);
    return { error: null };
  }, []);

  const latestWeight = history[0]?.weight_kg ?? null;
  const sparkData = history.slice(0, 7).map((e) => e.weight_kg).reverse();

  return { history, loading, saving, logWeight, latestWeight, sparkData };
}
