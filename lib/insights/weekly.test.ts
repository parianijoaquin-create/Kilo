import { describe, it, expect } from "vitest";
import { computeWeeklyInsights, weightTrendKg, type DayNutrition } from "./weekly";

function days(...vals: Array<[string, number, number]>): DayNutrition[] {
  return vals.map(([date, kcal, protein]) => ({ date, kcal, protein }));
}

describe("computeWeeklyInsights", () => {
  it("promedia solo los días con registro (ignora los de 0)", () => {
    const perDay = days(
      ["2026-07-06", 2000, 150],
      ["2026-07-07", 0, 0],       // sin registro
      ["2026-07-08", 2200, 130],
    );
    const r = computeWeeklyInsights(perDay, 2000);
    expect(r.daysLogged).toBe(2);
    expect(r.avgKcal).toBe(2100);   // (2000+2200)/2
    expect(r.avgProtein).toBe(140); // (150+130)/2
  });

  it("cuenta días 'en meta' dentro de ±15%", () => {
    const perDay = days(
      ["2026-07-06", 2000, 100], // exacto
      ["2026-07-07", 2300, 100], // +15% justo → dentro
      ["2026-07-08", 2400, 100], // +20% → fuera
      ["2026-07-09", 1700, 100], // -15% → dentro
    );
    const r = computeWeeklyInsights(perDay, 2000);
    expect(r.onTargetDays).toBe(3);
    expect(r.adherencePct).toBe(75); // 3 de 4
  });

  it("elige el día de más proteína", () => {
    const perDay = days(
      ["2026-07-06", 2000, 120],
      ["2026-07-07", 1800, 180],
      ["2026-07-08", 2100, 90],
    );
    expect(computeWeeklyInsights(perDay, 2000).bestProteinDay).toBe("2026-07-07");
  });

  it("semana vacía → todo en 0 y sin best day", () => {
    const r = computeWeeklyInsights(days(["2026-07-06", 0, 0]), 2000);
    expect(r).toMatchObject({ daysLogged: 0, avgKcal: 0, adherencePct: 0, bestProteinDay: null });
  });

  it("meta 0 no rompe la adherencia", () => {
    const r = computeWeeklyInsights(days(["2026-07-06", 2000, 100]), 0);
    expect(r.onTargetDays).toBe(0);
    expect(r.adherencePct).toBe(0);
  });
});

describe("weightTrendKg", () => {
  const today = new Date(2026, 6, 10);
  it("usa primer y último dentro de la ventana", () => {
    const entries = [
      { weight_kg: 80, logged_at: "2026-07-05T09:00:00Z" },
      { weight_kg: 79.2, logged_at: "2026-07-09T09:00:00Z" },
    ];
    expect(weightTrendKg(entries, today, 7)).toBe(-0.8);
  });
  it("menos de 2 registros → null", () => {
    expect(weightTrendKg([{ weight_kg: 80, logged_at: "2026-07-09T09:00:00Z" }], today)).toBeNull();
    expect(weightTrendKg([], today)).toBeNull();
  });
  it("sin 2 dentro de la ventana, cae a toda la serie", () => {
    const entries = [
      { weight_kg: 82, logged_at: "2026-06-01T09:00:00Z" },
      { weight_kg: 80, logged_at: "2026-06-10T09:00:00Z" },
    ];
    expect(weightTrendKg(entries, today, 7)).toBe(-2);
  });
});
