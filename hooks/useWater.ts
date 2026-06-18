"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export function useWater(date: string) {
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("water_logs")
        .select("glasses")
        .eq("user_id", user.id)
        .eq("log_date", date)
        .maybeSingle();

      if (!cancelled) {
        setGlasses((data as { glasses: number } | null)?.glasses ?? 0);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [date]);

  const setWater = useCallback(async (next: number) => {
    if (next < 0) return;
    const prev = glasses;
    setGlasses(next);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGlasses(prev); return; }

    const { error } = await supabase
      .from("water_logs")
      .upsert(
        { user_id: user.id, log_date: date, glasses: next },
        { onConflict: "user_id,log_date" }
      );

    if (error) setGlasses(prev);
  }, [date, glasses]);

  return { glasses, loading, setWater };
}
