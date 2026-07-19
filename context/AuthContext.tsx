"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  /** id del usuario logueado, o null si no hay sesión. */
  userId: string | null;
  /** true hasta resolver la sesión inicial (lectura local, casi inmediata). */
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ userId: null, loading: true });

/**
 * Resuelve la sesión UNA sola vez y la comparte. Usa getSession() (lee el token
 * de local storage, sin red) en vez de getUser() (round-trip al server de auth),
 * así los hooks de datos no pagan 5 idas y vueltas para saber quién sos al entrar.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<AuthState>({ userId: null, loading: true });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setState({ userId: session?.user?.id ?? null, loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ userId: session?.user?.id ?? null, loading: false });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
