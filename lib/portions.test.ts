import { describe, it, expect } from "vitest";
import { isRealUnitPortion, portionChips } from "./portions";

describe("isRealUnitPortion", () => {
  it("false para el genérico '1 porción' o datos faltantes", () => {
    expect(isRealUnitPortion("1 porción", 100)).toBe(false);
    expect(isRealUnitPortion("porción estimada", 120)).toBe(false);
    expect(isRealUnitPortion(null, 100)).toBe(false);
    expect(isRealUnitPortion("1 unidad", 0)).toBe(false);
    expect(isRealUnitPortion("1 unidad", null)).toBe(false);
  });
  it("true para una unidad casera real", () => {
    expect(isRealUnitPortion("1 unidad", 60)).toBe(true);
    expect(isRealUnitPortion("Puñado", 28)).toBe(true);
  });
});

describe("portionChips", () => {
  it("genera ½·1·2·3 de la porción de referencia", () => {
    const r = portionChips("1 unidad", 60);
    expect(r).not.toBeNull();
    expect(r!.unitLabel).toBe("1 unidad");
    expect(r!.chips).toEqual([
      { label: "½", grams: 30 },
      { label: "1", grams: 60 },
      { label: "2", grams: 120 },
      { label: "3", grams: 180 },
    ]);
  });
  it("redondea los gramos (porción impar)", () => {
    const r = portionChips("1 cda", 15);
    expect(r!.chips[0].grams).toBe(8); // round(7.5)
    expect(r!.chips[3].grams).toBe(45);
  });
  it("null para porción genérica", () => {
    expect(portionChips("1 porción", 100)).toBeNull();
  });
});
