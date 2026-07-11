import type { Food } from "@/types";

export interface NutrientSnapshot {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
}

/** Scale nutrients from per-100g values to a given gram amount */
export function nutrientsForGrams(food: Food, grams: number): NutrientSnapshot {
  const factor = grams / 100;
  return {
    calories_kcal: round((food.kcal_100g ?? 0) * factor),
    protein_g:     round((food.protein_g_100g ?? 0) * factor),
    carbs_g:       round((food.carbs_g_100g ?? 0) * factor),
    fat_g:         round((food.fat_g_100g ?? 0) * factor),
    fiber_g:       round((food.fiber_g_100g ?? 0) * factor),
    sodium_mg:     round((food.sodium_mg_100g ?? 0) * factor),
  };
}

/** Scale nutrients for a number of servings given a default portion size */
export function nutrientsForServings(food: Food, servings: number): NutrientSnapshot {
  const grams = (food.default_portion_g ?? 100) * servings;
  return nutrientsForGrams(food, grams);
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── Reescalado de items ya cargados en el diario ────────────────────────────

export interface Per100 { kcal: number; protein: number; carbs: number; fat: number; }

interface ScalableItem {
  grams: number | null;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  foods?: {
    kcal_100g: number | null;
    protein_g_100g: number | null;
    carbs_g_100g: number | null;
    fat_g_100g: number | null;
  } | null;
}

/**
 * Densidad nutricional por 100 g de un meal_item ya cargado. Prefiere los
 * valores del food asociado; si no hay (ej. item de barcode/foto sin food row),
 * los deriva de los macros absolutos guardados y sus gramos. Así se puede
 * reescalar cualquier item sin importar su origen.
 */
export function per100FromItem(item: ScalableItem): Per100 {
  if (item.foods && item.foods.kcal_100g != null) {
    return {
      kcal:    item.foods.kcal_100g ?? 0,
      protein: item.foods.protein_g_100g ?? 0,
      carbs:   item.foods.carbs_g_100g ?? 0,
      fat:     item.foods.fat_g_100g ?? 0,
    };
  }
  const g = item.grams && item.grams > 0 ? item.grams : 100;
  const k = 100 / g;
  return {
    kcal:    (item.calories_kcal ?? 0) * k,
    protein: (item.protein_g ?? 0) * k,
    carbs:   (item.carbs_g ?? 0) * k,
    fat:     (item.fat_g ?? 0) * k,
  };
}

/** Macros absolutos para `grams` a partir de una densidad por 100 g. */
export function scaleFromPer100(basis: Per100, grams: number) {
  const f = grams / 100;
  return {
    calories_kcal: Math.round(basis.kcal * f),
    protein_g:     round(basis.protein * f),
    carbs_g:       round(basis.carbs * f),
    fat_g:         round(basis.fat * f),
  };
}
