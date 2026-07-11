"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToday } from "@/hooks/useToday";
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
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [weightDelta, setWeightDelta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // 7 fechas locales: hoy y los 6 días anteriores.
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toLocaleDateString("en-CA"));
      }

      const { data: meals } = await supabase
        .from("meals")
        .select("eaten_at, meal_items ( calories_kcal, protein_g )")
        .eq("user_id", user.id)
        .gte("eaten_at", `${dates[0]}T00:00:00`)
        .lte("eaten_at", `${dates[dates.length - 1]}T23:59:59`);

      const byDate = new Map<string, { kcal: number; protein: number }>();
      for (const d of dates) byDate.set(d, { kcal: 0, protein: 0 });
      for (const m of (meals ?? []) as MealRow[]) {
        const day = new Date(m.eaten_at).toLocaleDateString("en-CA");
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
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true });

      if (cancelled) return;
      setInsights(computeWeeklyInsights(perDay, kcalGoal));
      setWeightDelta(weightTrendKg((weights ?? []) as Array<{ weight_kg: number; logged_at: string }>, new Date(), 7));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [today, kcalGoal]);

  return { insights, weightDelta, loading };
}
