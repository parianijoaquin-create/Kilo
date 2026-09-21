"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { readCache, userCacheKey, writeCache, useIsoLayoutEffect } from "@/lib/localCache";

export function useWater(date: string) {
  const { userId, loading: authLoading } = useAuth();
  const [glasses, setGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const cacheKey = userId ? userCacheKey(userId, `water:${date}`) : null;

  const commitGlasses = useCallback((next: number) => {
    setGlasses(next);
    if (cacheKey) writeCache(cacheKey, next);
  }, [cacheKey]);

  useIsoLayoutEffect(() => {
    if (!cacheKey) return;
    const cached = readCache<number>(cacheKey);
    if (cached != null) {
      setGlasses(cached);
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) return;

    let cancelled = false;

    async function load() {
      const { data, error: loadError } = await supabase
        .from("water_logs")
        .select("glasses")
        .eq("user_id", userId)
        .eq("log_date", date)
        .maybeSingle();

      if (!cancelled) {
        if (!loadError) commitGlasses((data as { glasses: number } | null)?.glasses ?? 0);
        setError(loadError?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading, date, commitGlasses]);

  const setWater = useCallback(async (next: number) => {
    if (next < 0) return;
    const prev = glasses;
    commitGlasses(next);

    if (!userId) { commitGlasses(prev); return; }

    const { error } = await supabase
      .from("water_logs")
      .upsert(
        { user_id: userId, log_date: date, glasses: next },
        { onConflict: "user_id,log_date" }
      );

    if (error) {
      commitGlasses(prev);
      setError(error.message);
    } else {
      setError(null);
    }
  }, [supabase, userId, date, glasses, commitGlasses]);

  return { glasses, loading: authLoading || (!!userId && loading), error, setWater };
}
