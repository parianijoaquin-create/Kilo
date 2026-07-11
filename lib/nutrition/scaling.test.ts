import { describe, it, expect } from "vitest";
import { nutrientsForGrams, nutrientsForServings, per100FromItem, scaleFromPer100 } from "./scaling";
import type { Food } from "@/types";

const food = {
  kcal_100g: 100, protein_g_100g: 10, carbs_g_100g: 20, fat_g_100g: 5,
  fiber_g_100g: 2, sodium_mg_100g: 400, default_portion_g: 50,
} as unknown as Food;

describe("nutrientsForGrams", () => {
  it("escala linealmente y redondea a 1 decimal", () => {
    expect(nutrientsForGrams(food, 150)).toEqual({
      calories_kcal: 150, protein_g: 15, carbs_g: 30, fat_g: 7.5,
      fiber_g: 3, sodium_mg: 600,
    });
  });
  it("0 g → todo 0", () => {
    expect(nutrientsForGrams(food, 0).calories_kcal).toBe(0);
  });
});

describe("nutrientsForServings", () => {
  it("usa default_portion_g por porción", () => {
    // 2 porciones × 50 g = 100 g
    expect(nutrientsForServings(food, 2).calories_kcal).toBe(100);
  });
});

describe("per100FromItem", () => {
  it("prefiere los valores del food asociado", () => {
    const item = {
      grams: 200, calories_kcal: 999, protein_g: 99, carbs_g: 99, fat_g: 99,
      foods: { kcal_100g: 89, protein_g_100g: 1.1, carbs_g_100g: 23, fat_g_100g: 0.3 },
    };
    expect(per100FromItem(item)).toEqual({ kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 });
  });
  it("deriva la densidad de los macros guardados si no hay food", () => {
    const item = { grams: 120, calories_kcal: 107, protein_g: 1.3, carbs_g: 27.4, fat_g: 0.4, foods: null };
    const p = per100FromItem(item);
    expect(p.kcal).toBeCloseTo(89.17, 2); // 107 * 100 / 120
    expect(p.protein).toBeCloseTo(1.083, 2);
  });
  it("gramos nulos o 0 usan 100 como base (sin dividir por 0)", () => {
    const item = { grams: 0, calories_kcal: 50, protein_g: 5, carbs_g: 5, fat_g: 5, foods: null };
    expect(per100FromItem(item).kcal).toBe(50);
  });
});

describe("scaleFromPer100", () => {
  const basis = { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 };
  it("kcal entero, macros a 1 decimal", () => {
    expect(scaleFromPer100(basis, 100)).toEqual({
      calories_kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3,
    });
    expect(scaleFromPer100(basis, 150)).toEqual({
      calories_kcal: 134, protein_g: 1.7, carbs_g: 34.5, fat_g: 0.5,
    });
  });
  it("ida y vuelta: derivar y reescalar a los mismos gramos preserva ~macros", () => {
    const item = { grams: 120, calories_kcal: 107, protein_g: 1.3, carbs_g: 27.4, fat_g: 0.4, foods: null };
    const again = scaleFromPer100(per100FromItem(item), 120);
    expect(again.calories_kcal).toBe(107);
    expect(again.carbs_g).toBeCloseTo(27.4, 1);
  });
});
