"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { readCache, userCacheKey, writeCache, useIsoLayoutEffect } from "@/lib/localCache";
import type { Profile } from "@/types";

export function useProfile() {
  const { userId, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);
  const cacheKey = userId ? userCacheKey(userId, "profile") : null;

  // Hidrata el último perfil conocido antes del primer paint (sin parpadeo).
  useIsoLayoutEffect(() => {
    if (!cacheKey) return;
    const cached = readCache<Profile>(cacheKey);
    if (cached) {
      setProfile(cached);
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) return;

    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!cancelled) {
        if (data) {
          setProfile(data as Profile);
          if (cacheKey) writeCache(cacheKey, data);
        }
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading, cacheKey]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!userId) return { error: "No autenticado" };

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (!error && data) {
      setProfile(data as Profile);
      if (cacheKey) writeCache(cacheKey, data);
    }
    return { error: error?.message ?? null };
  }, [supabase, userId, cacheKey]);

  return { profile, loading: authLoading || (!!userId && loading), error, updateProfile };
}
