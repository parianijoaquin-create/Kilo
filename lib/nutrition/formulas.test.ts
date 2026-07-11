import { describe, it, expect } from "vitest";
import {
  bmr, tdee, dailyKcalTarget, defaultMacroTargets,
  recommendedWeeklyChangeKg, projectGoal,
  macrosFromPercents, percentsFromMacros, ageFromBirthDate,
} from "./formulas";

describe("bmr (Mifflin-St Jeor)", () => {
  const base = { weight_kg: 80, height_cm: 180, age_years: 30 };
  // 10*80 + 6.25*180 - 5*30 = 1775
  it("hombre = base + 5", () => {
    expect(bmr({ ...base, sex: "male" })).toBe(1780);
  });
  it("mujer = base - 161", () => {
    expect(bmr({ ...base, sex: "female" })).toBe(1614);
  });
  it("other = base - 78 (punto medio)", () => {
    expect(bmr({ ...base, sex: "other" })).toBe(1697);
  });
});

describe("tdee", () => {
  it("multiplica por el factor de actividad y redondea", () => {
    expect(tdee(1780, "moderate")).toBe(Math.round(1780 * 1.55)); // 2759
    expect(tdee(1780, "sedentary")).toBe(Math.round(1780 * 1.2)); // 2136
  });
});

describe("dailyKcalTarget", () => {
  it("ajusta por objetivo", () => {
    expect(dailyKcalTarget(2500, "maintain")).toBe(2500);
    expect(dailyKcalTarget(2500, "lose")).toBe(2100);
    expect(dailyKcalTarget(2500, "gain")).toBe(2800);
    expect(dailyKcalTarget(2500, "recomp")).toBe(2300);
  });
});

describe("defaultMacroTargets", () => {
  it("mantener: 25% proteína, la suma de macros ≈ kcal", () => {
    const m = defaultMacroTargets(2000, "maintain");
    expect(m).toEqual({ protein_g: 125, fat_g: 56, carbs_g: 249 });
    const kcal = m.protein_g * 4 + m.carbs_g * 4 + m.fat_g * 9;
    expect(Math.abs(kcal - 2000)).toBeLessThanOrEqual(5);
  });
  it("bajar de peso sube la proteína a 35%", () => {
    const m = defaultMacroTargets(2000, "lose");
    expect(m.protein_g).toBe(175);
  });
});

describe("recommendedWeeklyChangeKg", () => {
  it("bajar: negativo, escala con el peso y clampa 0.35–0.9", () => {
    expect(recommendedWeeklyChangeKg("lose", 80)).toBeCloseTo(-0.52, 5);
    expect(recommendedWeeklyChangeKg("lose", 40)).toBe(-0.35); // clamp inferior
    expect(recommendedWeeklyChangeKg("lose", 200)).toBe(-0.9); // clamp superior
  });
  it("subir: positivo; mantener: 0", () => {
    expect(recommendedWeeklyChangeKg("gain", 80)).toBeCloseTo(0.28, 5);
    expect(recommendedWeeklyChangeKg("maintain", 80)).toBe(0);
  });
});

describe("projectGoal", () => {
  it("proyecta semanas y fecha cuando la dirección es coherente", () => {
    const p = projectGoal(80, 75, "lose");
    expect(p.deltaKg).toBe(-5);
    expect(p.weeks).toBe(10); // ceil(5 / 0.52)
    expect(p.targetDate).toBeInstanceOf(Date);
    expect(p.directionMismatch).toBe(false);
    expect(p.reached).toBe(false);
  });
  it("marca reached cuando ya estás en la meta", () => {
    const p = projectGoal(80, 80, "lose");
    expect(p.reached).toBe(true);
    expect(p.weeks).toBe(0);
  });
  it("detecta contradicción de dirección (meta más pesada con objetivo bajar)", () => {
    const p = projectGoal(80, 85, "lose");
    expect(p.directionMismatch).toBe(true);
    expect(p.weeks).toBeNull();
    expect(p.targetDate).toBeNull();
  });
  it("mantener siempre es mismatch si hay delta", () => {
    expect(projectGoal(80, 78, "maintain").directionMismatch).toBe(true);
  });
});

describe("macros ↔ percents (ida y vuelta)", () => {
  it("macrosFromPercents", () => {
    expect(macrosFromPercents(2000, 30, 40, 30)).toEqual({
      protein_g: 150, carbs_g: 200, fat_g: 67,
    });
  });
  it("percentsFromMacros normaliza a 100", () => {
    const p = percentsFromMacros(150, 200, 67);
    expect(p.proteinPct + p.carbsPct + p.fatPct).toBe(100);
    expect(p).toEqual({ proteinPct: 30, carbsPct: 40, fatPct: 30 });
  });
  it("percentsFromMacros con kcal 0 devuelve default", () => {
    expect(percentsFromMacros(0, 0, 0)).toEqual({ proteinPct: 30, carbsPct: 40, fatPct: 30 });
  });
});

describe("ageFromBirthDate", () => {
  const pad = (n: number) => String(n).padStart(2, "0");
  it("cumpleaños hoy → edad exacta", () => {
    const d = new Date();
    const birth = `${d.getFullYear() - 30}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    expect(ageFromBirthDate(birth)).toBe(30);
  });
  it("cumpleaños aún no llegó este año → edad - 1", () => {
    const d = new Date();
    d.setDate(d.getDate() + 5); // 5 días en el futuro asegura que aún no cumplió
    const birth = `${d.getFullYear() - 20}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    expect(ageFromBirthDate(birth)).toBe(19);
  });
});
