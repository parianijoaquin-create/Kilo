export interface DayNutrition {
  date: string;   // YYYY-MM-DD (local)
  kcal: number;
  protein: number;
}

export interface WeeklyInsights {
  daysLogged: number;      // días con registro (kcal > 0)
  avgKcal: number;         // promedio de kcal sobre días registrados
  avgProtein: number;      // promedio de proteína sobre días registrados
  kcalGoal: number;
  onTargetDays: number;    // días dentro de ±15% de la meta de kcal
  adherencePct: number;    // onTargetDays / daysLogged * 100
  bestProteinDay: string | null;
  perDay: DayNutrition[];  // los 7 días en orden cronológico
}

const TARGET_TOLERANCE = 0.15; // ±15% de la meta cuenta como "en meta"

/** Agrega la nutrición de la semana. Solo promedia días con registro real. */
export function computeWeeklyInsights(perDay: DayNutrition[], kcalGoal: number): WeeklyInsights {
  const logged = perDay.filter((d) => d.kcal > 0);
  const daysLogged = logged.length;

  const avgKcal = daysLogged
    ? Math.round(logged.reduce((s, d) => s + d.kcal, 0) / daysLogged)
    : 0;
  const avgProtein = daysLogged
    ? Math.round(logged.reduce((s, d) => s + d.protein, 0) / daysLogged)
    : 0;

  const tol = kcalGoal * TARGET_TOLERANCE;
  const onTargetDays = kcalGoal > 0
    ? logged.filter((d) => Math.abs(d.kcal - kcalGoal) <= tol).length
    : 0;
  const adherencePct = daysLogged ? Math.round((onTargetDays / daysLogged) * 100) : 0;

  const bestProteinDay = logged.length
    ? logged.reduce((a, b) => (b.protein > a.protein ? b : a)).date
    : null;

  return { daysLogged, avgKcal, avgProtein, kcalGoal, onTargetDays, adherencePct, bestProteinDay, perDay };
}

/**
 * Cambio de peso (kg, con signo) en la ventana reciente. Usa el primer y último
 * registro dentro de `days`; si no hay dos en la ventana, cae al primero y
 * último de toda la serie. Null si hay menos de 2 registros.
 */
export function weightTrendKg(
  entries: Array<{ weight_kg: number; logged_at: string }>,
  today: Date = new Date(),
  days = 7
): number | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => +new Date(a.logged_at) - +new Date(b.logged_at));

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  const within = sorted.filter((e) => new Date(e.logged_at) >= cutoff);

  const series = within.length >= 2 ? within : sorted;
  const delta = series[series.length - 1].weight_kg - series[0].weight_kg;
  return Math.round(delta * 10) / 10;
}
