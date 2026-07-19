"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { readCache, writeCache, useIsoLayoutEffect } from "@/lib/localCache";
import type { Profile } from "@/types";

const CACHE_KEY = "kilo:profile";

export function useProfile() {
  const { userId, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Hidrata el último perfil conocido antes del primer paint (sin parpadeo).
  useIsoLayoutEffect(() => {
    const cached = readCache<Profile>(CACHE_KEY);
    if (cached) setProfile(cached);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!cancelled) {
        if (data) { setProfile(data as Profile); writeCache(CACHE_KEY, data); }
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!userId) return { error: "No autenticado" };

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (!error && data) { setProfile(data as Profile); writeCache(CACHE_KEY, data); }
    return { error: error?.message ?? null };
  }, [supabase, userId]);

  return { profile, loading, error, updateProfile };
}
