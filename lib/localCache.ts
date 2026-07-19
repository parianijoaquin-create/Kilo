import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect en cliente (corre antes del paint → sin parpadeo del "0"),
 * useEffect en server (evita el warning de SSR). Patrón isomórfico estándar.
 */
export const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Lee y parsea un valor cacheado. Devuelve null si no existe o está corrupto. */
export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Persiste un valor (best-effort; ignora quota/errores de serialización). */
export function writeCache(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage lleno o no disponible: seguimos sin cachear */
  }
}
