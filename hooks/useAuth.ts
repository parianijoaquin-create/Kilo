"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth as useAuthContext } from "@/context/AuthContext";

/**
 * Acciones de auth (signIn/signUp/signOut) sobre el estado COMPARTIDO del
 * AuthContext. El estado (userId/loading) sale de un único getSession +
 * onAuthStateChange (ver context/AuthContext); acá no hacemos getUser() ni
 * montamos otro listener, para no duplicar round-trips ni suscripciones.
 */
export function useAuth() {
  const { userId, loading } = useAuthContext();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) router.push("/dashboard");
    return { error };
  }, [supabase, router]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName ?? email.split("@")[0] } },
    });
    if (!error) router.push("/onboarding");
    return { error };
  }, [supabase, router]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  return { userId, loading, signIn, signUp, signOut };
}
