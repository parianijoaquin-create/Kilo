"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Meal, MealItem } from "@/types";

export function useDiary(date?: string) {
  const targetDate = date ?? new Date().toISOString().split("T")[0];
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("meals")
        .select(`
          id, meal_type, logged_at, notes,
          meal_items (
            id, food_id, quantity_g, quantity_unit, quantity_amount,
            foods ( name, emoji, kcal_per_100g, protein_g, carbs_g, fat_g )
          )
        `)
        .eq("user_id", user.id)
        .gte("logged_at", `${targetDate}T00:00:00`)
        .lte("logged_at", `${targetDate}T23:59:59`)
        .order("logged_at", { ascending: true });

      if (!cancelled) {
        setMeals((data as unknown as Meal[]) ?? []);
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [targetDate]);

  const addMealItem = useCallback(async (mealType: string, item: Partial<MealItem>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    let mealId: string;
    const existing = meals.find((m) => m.meal_type === mealType);

    if (existing) {
      mealId = existing.id;
    } else {
      const { data: newMeal, error: mealErr } = await supabase
        .from("meals")
        .insert({ user_id: user.id, meal_type: mealType, eaten_at: new Date().toISOString() })
        .select()
        .single();
      if (mealErr || !newMeal) return { error: mealErr?.message ?? "Error creando comida" };
      mealId = (newMeal as unknown as Meal).id;
    }

    const { error } = await supabase
      .from("meal_items")
      .insert({ ...item, meal_id: mealId });

    if (!error) {
      const { data, error: fetchErr } = await supabase
        .from("meals")
        .select(`id, meal_type, logged_at, notes, meal_items (*)`)
        .eq("id", mealId)
        .single();
      if (!fetchErr && data) {
        setMeals((prev) =>
          existing
            ? prev.map((m) => (m.id === mealId ? (data as unknown as Meal) : m))
            : [...prev, data as unknown as Meal]
        );
      }
    }

    return { error: error?.message ?? null };
  }, [meals]);

  const deleteMealItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from("meal_items").delete().eq("id", itemId);
    if (!error) {
      setMeals((prev) =>
        prev.map((m) => ({
          ...m,
          items: m.items?.filter((i) => i.id !== itemId),
        }))
      );
    }
    return { error: error?.message ?? null };
  }, []);

  return { meals, loading, error, addMealItem, deleteMealItem };
}
