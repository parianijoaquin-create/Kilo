import { describe, it, expect } from "vitest";
import { currentStreak, ymdLocal } from "./streak";

// Construye fechas con componentes locales (evita corrimientos de zona horaria).
function localDate(y: number, m: number, d: number) {
  return new Date(y, m - 1, d);
}
function daysBefore(today: Date, n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return ymdLocal(d);
}

describe("currentStreak", () => {
  const today = localDate(2026, 7, 10);

  it("cuenta días consecutivos terminando hoy", () => {
    const done = [0, 1, 2].map((n) => daysBefore(today, n)); // hoy, ayer, anteayer
    expect(currentStreak(done, today)).toBe(3);
  });

  it("hoy pendiente pero ayer hecho → racha sigue viva desde ayer", () => {
    const done = [1, 2, 3].map((n) => daysBefore(today, n)); // ayer y antes, NO hoy
    expect(currentStreak(done, today)).toBe(3);
  });

  it("ni hoy ni ayer → 0", () => {
    const done = [2, 3].map((n) => daysBefore(today, n));
    expect(currentStreak(done, today)).toBe(0);
  });

  it("se corta en el primer hueco", () => {
    const done = [0, 1, 3, 4].map((n) => daysBefore(today, n)); // falta anteayer (2)
    expect(currentStreak(done, today)).toBe(2);
  });

  it("sin registros → 0", () => {
    expect(currentStreak([], today)).toBe(0);
  });

  it("solo hoy → 1", () => {
    expect(currentStreak([daysBefore(today, 0)], today)).toBe(1);
  });

  it("acepta un Set y no cuenta duplicados", () => {
    const set = new Set([daysBefore(today, 0), daysBefore(today, 0), daysBefore(today, 1)]);
    expect(currentStreak(set, today)).toBe(2);
  });
});
