"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useWater(date: string) {
  const { userId, loading: authLoading } = useAuth();
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("water_logs")
        .select("glasses")
        .eq("user_id", userId)
        .eq("log_date", date)
        .maybeSingle();

      if (!cancelled) {
        setGlasses((data as { glasses: number } | null)?.glasses ?? 0);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading, date]);

  const setWater = useCallback(async (next: number) => {
    if (next < 0) return;
    const prev = glasses;
    setGlasses(next);

    if (!userId) { setGlasses(prev); return; }

    const { error } = await supabase
      .from("water_logs")
      .upsert(
        { user_id: userId, log_date: date, glasses: next },
        { onConflict: "user_id,log_date" }
      );

    if (error) setGlasses(prev);
  }, [supabase, userId, date, glasses]);

  return { glasses, loading, setWater };
}
