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
