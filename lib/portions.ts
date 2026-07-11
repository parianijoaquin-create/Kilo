// Chips de porciones caseras a partir de la porción de referencia del alimento.

export interface PortionChip {
  label: string;   // "½", "1", "2", "3"
  grams: number;   // gramos resultantes
}

const GENERIC_PORTION_NAMES = new Set([
  "1 porción", "1 porcion", "porción", "porcion",
  "porción estimada", "porcion estimada",
]);

/** ¿La porción de referencia es una unidad casera real (no el genérico "1 porción")? */
export function isRealUnitPortion(name: string | null | undefined, grams: number | null | undefined): boolean {
  if (!name || grams == null || grams <= 0) return false;
  return !GENERIC_PORTION_NAMES.has(name.trim().toLowerCase());
}

/**
 * Genera chips ½·1·2·3 de la porción casera del alimento. Cada chip fija los
 * gramos = múltiplo × porción de referencia. Null si la porción es genérica.
 */
export function portionChips(
  name: string | null | undefined,
  grams: number | null | undefined
): { unitLabel: string; chips: PortionChip[] } | null {
  if (!isRealUnitPortion(name, grams)) return null;
  const g = grams as number;
  const mults: Array<{ m: number; label: string }> = [
    { m: 0.5, label: "½" },
    { m: 1, label: "1" },
    { m: 2, label: "2" },
    { m: 3, label: "3" },
  ];
  return {
    unitLabel: (name as string).trim(),
    chips: mults.map(({ m, label }) => ({ label, grams: Math.round(g * m) })),
  };
}
