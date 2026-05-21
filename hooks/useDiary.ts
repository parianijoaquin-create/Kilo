"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToday } from "@/hooks/useToday";

export interface DiaryFood {
  canonical_name: string;
  kcal_100g: number | null;
  protein_g_100g: number | null;
  carbs_g_100g: number | null;
  fat_g_100g: number | null;
}

export interface DiaryItem {
  id: string;
  food_id: number | null;
  barcode_product_id: number | null;
  item_name_snapshot: string;
  grams: number | null;
  unit: string | null;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  foods: DiaryFood | null;
}

export interface DiaryMeal {
  id: string;
  meal_type: string;
  eaten_at: string;
  notes: string | null;
  meal_items: DiaryItem[];
}

export function useDiary(date?: string) {
  const today = useToday();
  const targetDate = date ?? today;
  const [meals, setMeals] = useState<DiaryMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("meals")
        .select(`
          id, meal_type, eaten_at, notes,
          meal_items (
            id, food_id, barcode_product_id, item_name_snapshot, grams, unit,
            calories_kcal, protein_g, carbs_g, fat_g,
            foods ( canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g )
          )
        `)
        .eq("user_id", user.id)
        .gte("eaten_at", `${targetDate}T00:00:00`)
        .lte("eaten_at", `${targetDate}T23:59:59`)
        .order("eaten_at", { ascending: true });

      if (!cancelled) {
        setMeals((data as unknown as DiaryMeal[]) ?? []);
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [targetDate]);

  const addMealItem = useCallback(async (
    mealType: string,
    item: {
      food_id: number;
      barcode_product_id?: number;
      item_name_snapshot: string;
      grams: number;
      unit?: string;
      calories_kcal: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      source_method?: "manual" | "barcode" | "ocr" | "photo" | "recipe";
      confidence_score?: number;
      raw_estimation?: Record<string, unknown>;
    }
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Fetch authoritative meal from DB (avoids races where local state lags behind concurrent inserts)
    const { data: existingMeals } = await supabase
      .from("meals")
      .select("id")
      .eq("user_id", user.id)
      .eq("meal_type", mealType)
      .gte("eaten_at", `${targetDate}T00:00:00`)
      .lte("eaten_at", `${targetDate}T23:59:59`)
      .limit(1);

    const existing = existingMeals?.[0] as { id: string } | undefined;
    let mealId: string;

    if (existing) {
      mealId = existing.id;
    } else {
      const { data: newMeal, error: mealErr } = await supabase
        .from("meals")
        .insert({
          user_id: user.id,
          meal_type: mealType,
          eaten_at: new Date().toISOString(),
          capture_method: item.source_method ?? "manual",
        })
        .select()
        .single();
      if (mealErr || !newMeal) return { error: mealErr?.message ?? "Error creando comida" };
      mealId = (newMeal as { id: string }).id;
    }

    const { error } = await supabase
      .from("meal_items")
      .insert({ ...item, meal_id: mealId });

    if (!error) {
      const { data, error: fetchErr } = await supabase
        .from("meals")
        .select(`
          id, meal_type, eaten_at, notes,
          meal_items (
            id, food_id, barcode_product_id, item_name_snapshot, grams, unit,
            calories_kcal, protein_g, carbs_g, fat_g,
            foods ( canonical_name, kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g )
          )
        `)
        .eq("id", mealId)
        .single();
      if (!fetchErr && data) {
        setMeals((prev) =>
          prev.some((m) => m.id === mealId)
            ? prev.map((m) => (m.id === mealId ? (data as unknown as DiaryMeal) : m))
            : [...prev, data as unknown as DiaryMeal]
        );
      }
    }

    return { error: error?.message ?? null };
  }, [targetDate]);

  const deleteMealItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from("meal_items").delete().eq("id", itemId);
    if (!error) {
      setMeals((prev) =>
        prev.map((m) => ({
          ...m,
          meal_items: m.meal_items.filter((i) => i.id !== itemId),
        }))
      );
    }
    return { error: error?.message ?? null };
  }, []);

  const totals = meals.reduce(
    (acc, meal) => {
      meal.meal_items.forEach((item) => {
        acc.kcal    += item.calories_kcal ?? 0;
        acc.protein += item.protein_g ?? 0;
        acc.carbs   += item.carbs_g ?? 0;
        acc.fat     += item.fat_g ?? 0;
      });
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { meals, loading, error, totals, addMealItem, deleteMealItem };
}
