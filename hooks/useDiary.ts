"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToday } from "@/hooks/useToday";
import { useAuth } from "@/context/AuthContext";
import { readCache, writeCache, useIsoLayoutEffect } from "@/lib/localCache";
import { per100FromItem, scaleFromPer100 } from "@/lib/nutrition/scaling";
import { localDayRangeUtc, localNoonUtc } from "@/lib/date";

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
  const { userId, loading: authLoading } = useAuth();
  const [meals, setMeals] = useState<DiaryMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const cacheKey = `kilo:meals:${targetDate}`;

  // Actualiza el estado y persiste en caché en el mismo paso, para que al volver
  // a entrar las comidas (y las calorías) aparezcan al instante desde local.
  const commitMeals = useCallback((
    updater: DiaryMeal[] | ((prev: DiaryMeal[]) => DiaryMeal[]),
  ) => {
    setMeals((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeCache(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  // Hidrata las comidas cacheadas de esta fecha antes del primer paint.
  useIsoLayoutEffect(() => {
    const cached = readCache<DiaryMeal[]>(cacheKey);
    setMeals(cached ?? []);
  }, [cacheKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }

    let cancelled = false;

    async function load() {
      const { start, end } = localDayRangeUtc(targetDate);
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
        .eq("user_id", userId)
        .gte("eaten_at", start)
        .lte("eaten_at", end)
        .order("eaten_at", { ascending: true });

      if (!cancelled) {
        commitMeals((data as unknown as DiaryMeal[]) ?? []);
        setError(error?.message ?? null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase, userId, authLoading, targetDate, commitMeals]);

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
    if (!userId) return { error: "No autenticado" };

    // Fetch authoritative meal from DB (avoids races where local state lags behind concurrent inserts)
    const { start: dayStart, end: dayEnd } = localDayRangeUtc(targetDate);
    const { data: existingMeals } = await supabase
      .from("meals")
      .select("id")
      .eq("user_id", userId)
      .eq("meal_type", mealType)
      .gte("eaten_at", dayStart)
      .lte("eaten_at", dayEnd)
      .limit(1);

    const existing = existingMeals?.[0] as { id: string } | undefined;
    let mealId: string;

    if (existing) {
      mealId = existing.id;
    } else {
      // eaten_at debe caer dentro de targetDate: si estamos viendo hoy usamos la
      // hora real; si es un día pasado lo anclamos al mediodía LOCAL de ESE día
      // (convertido a UTC) para que el item no se registre en la fecha equivocada
      // ni desaparezca al recargar, sin importar la zona horaria del usuario.
      const eatenAt =
        targetDate === today
          ? new Date().toISOString()
          : localNoonUtc(targetDate);

      const { data: newMeal, error: mealErr } = await supabase
        .from("meals")
        .insert({
          user_id: userId,
          meal_type: mealType,
          eaten_at: eatenAt,
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
        commitMeals((prev) =>
          prev.some((m) => m.id === mealId)
            ? prev.map((m) => (m.id === mealId ? (data as unknown as DiaryMeal) : m))
            : [...prev, data as unknown as DiaryMeal]
        );
      }
    }

    return { error: error?.message ?? null };
  }, [supabase, userId, targetDate, today, commitMeals]);

  const updateMealItem = useCallback(async (itemId: string, newGrams: number) => {
    const grams = Math.round(newGrams);
    if (!Number.isFinite(grams) || grams <= 0) return { error: "Cantidad inválida" };

    // Buscar el item para conocer su densidad por 100 g.
    const target = meals.flatMap((m) => m.meal_items).find((i) => i.id === itemId);
    if (!target) return { error: "Item no encontrado" };

    const patch = { grams, unit: "g", ...scaleFromPer100(per100FromItem(target), grams) };

    // Optimista: aplicar en local y revertir si falla.
    const prevSnapshot = meals;
    commitMeals((prev) =>
      prev.map((m) => ({
        ...m,
        meal_items: m.meal_items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
      }))
    );

    const { error } = await supabase.from("meal_items").update(patch).eq("id", itemId);
    if (error) commitMeals(prevSnapshot);
    return { error: error?.message ?? null };
  }, [supabase, meals, commitMeals]);

  const deleteMealItem = useCallback(async (itemId: string) => {
    const { error } = await supabase.from("meal_items").delete().eq("id", itemId);
    if (error) return { error: error.message };

    // Si la comida quedó sin items, borramos también la fila `meals` para no
    // dejar una comida vacía huérfana (que reaparecería como card vacía al recargar).
    const parent = meals.find((m) => m.meal_items.some((i) => i.id === itemId));
    if (parent && parent.meal_items.length === 1) {
      await supabase.from("meals").delete().eq("id", parent.id);
    }

    commitMeals((prev) =>
      prev
        .map((m) => ({
          ...m,
          meal_items: m.meal_items.filter((i) => i.id !== itemId),
        }))
        .filter((m) => m.meal_items.length > 0)
    );
    return { error: null };
  }, [supabase, meals, commitMeals]);

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

  return { meals, loading, error, totals, addMealItem, updateMealItem, deleteMealItem };
}
