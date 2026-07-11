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

// UUID centinela: representa el contador GLOBAL (no es un usuario real).
const GLOBAL_BUCKET_USER_ID = "00000000-0000-0000-0000-000000000000";
const ONE_DAY_SECONDS = 24 * 60 * 60;

/**
 * Tope GLOBAL diario de llamadas a un servicio pago (ej: Gemini), compartido
 * entre TODOS los usuarios. Sirve de techo de seguridad para no superar el free
 * tier ni disparar costos si algún día se activa facturación.
 *
 * A diferencia de consumeRateLimit (por usuario), acá usamos un user_id
 * centinela fijo + ventana de 1 día, reutilizando la misma función atómica.
 *
 * IMPORTANTE: acá fallamos CERRADO. Si no podemos confirmar que estamos bajo el
 * tope, bloqueamos — preferimos rechazar una foto que arriesgar un cargo.
 */
export async function consumeGlobalDailyCap(
  supabase: SupabaseClient,
  action: string,
  maxPerDay: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_user_id: GLOBAL_BUCKET_USER_ID,
    p_action: `global:${action}`,
    p_max: maxPerDay,
    p_window_seconds: ONE_DAY_SECONDS,
  });

  if (error) {
    console.error("consume_global_daily_cap error", error);
    return false; // fail-closed: ante la duda, no gastamos
  }
  return data === true;
}
