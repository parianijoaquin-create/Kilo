"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToday } from "@/hooks/useToday";
import { useAuth } from "@/context/AuthContext";
import { localDayRangeUtc, toLocalDate } from "@/lib/date";
import {
  computeWeeklyInsights, weightTrendKg,
  type DayNutrition, type WeeklyInsights,
} from "@/lib/insights/weekly";

type MealRow = {
  eaten_at: string;
  meal_items: Array<{ calories_kcal: number | null; protein_g: number | null }> | null;
};

/** Insights de los últimos 7 días (hoy incluido) para una meta de kcal dada. */
export function useWeeklyInsights(kcalGoal: number) {
  const today = useToday();
  const { userId, loading: authLoading } = useAuth();
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [weightDelta, setWeightDelta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      // 7 fechas locales: hoy y los 6 días anteriores.
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(toLocalDate(d));
      }

      const { data: meals, error: mealsErr } = await supabase
        .from("meals")
        .select("eaten_at, meal_items ( calories_kcal, protein_g )")
        .eq("user_id", userId)
        .gte("eaten_at", localDayRangeUtc(dates[0]).start)
        .lte("eaten_at", localDayRangeUtc(dates[dates.length - 1]).end);

      if (mealsErr) {
        if (!cancelled) { setError(mealsErr.message); setLoading(false); }
        return;
      }

      const byDate = new Map<string, { kcal: number; protein: number }>();
      for (const d of dates) byDate.set(d, { kcal: 0, protein: 0 });
      for (const m of (meals ?? []) as MealRow[]) {
        const day = toLocalDate(new Date(m.eaten_at));
        const bucket = byDate.get(day);
        if (!bucket) continue;
        for (const it of m.meal_items ?? []) {
          bucket.kcal += it.calories_kcal ?? 0;
          bucket.protein += it.protein_g ?? 0;
        }
      }
      const perDay: DayNutrition[] = dates.map((date) => ({
        date,
        kcal: Math.round(byDate.get(date)!.kcal),
        protein: Math.round(byDate.get(date)!.protein),
      }));

      const { data: weights } = await supabase
        .from("weight_logs")
        .select("weight_kg, logged_at")
        .eq("user_id", userId)
        .order("logged_at", { ascending: true });

      if (cancelled) return;
      setError(null);
      setInsights(computeWeeklyInsights(perDay, kcalGoal));
      setWeightDelta(weightTrendKg((weights ?? []) as Array<{ weight_kg: number; logged_at: string }>, new Date(), 7));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading, today, kcalGoal]);

  return { insights, weightDelta, loading, error };
}
