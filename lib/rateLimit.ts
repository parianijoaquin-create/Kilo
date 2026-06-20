import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rate limit persistente por usuario+acción usando Postgres (serverless-safe).
 * Devuelve true si la request está permitida, false si superó el límite.
 *
 * Requiere la función `consume_rate_limit` (ver sql/migrations_add_rate_limits.sql).
 * Si el RPC falla por algún motivo, dejamos pasar (fail-open) para no romper
 * la app por culpa del limitador.
 */
export async function consumeRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  max: number,
  windowSeconds = 60
): Promise<boolean> {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_user_id: userId,
    p_action: action,
    p_max: max,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("consume_rate_limit error", error);
    return true; // fail-open
  }
  return data === true;
}
