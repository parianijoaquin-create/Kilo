import type { RankableFood } from "./foodSearch";
import { searchFoods } from "./foodSearch";

// Palabras clave de alimentos típicos por momento del día (es-AR). Cada una se
// resuelve contra el catálogo real vía searchFoods, así siempre sugerimos algo
// que existe en la base (y con sus macros/porciones reales).
const KEYWORDS_BY_MEAL: Record<string, string[]> = {
  // Mañana / desayuno
  morning: [
    "pan", "huevo", "cafe", "leche", "yogur", "avena", "tostada",
    "banana", "queso", "dulce de leche", "mermelada", "mate cocido",
    "medialuna", "jugo de naranja", "manteca",
  ],
  // Mediodía / almuerzo
  lunch: [
    "milanesa", "pechuga de pollo", "arroz", "fideos", "carne", "bife",
    "ensalada", "papa", "pure", "tarta", "empanada", "lentejas",
    "calabaza", "atun", "tomate",
  ],
  // Tarde / merienda
  snack: [
    "yogur", "banana", "manzana", "galletitas", "barrita de cereal",
    "mani", "almendras", "tostada", "queso", "cafe con leche",
    "fruta", "chocolate",
  ],
  // Noche / cena
  dinner: [
    "pollo", "pescado", "ensalada", "tortilla", "sopa", "huevo",
    "verduras", "tarta", "carne", "arroz", "calabaza", "milanesa",
    "queso", "pure",
  ],
};

// Fallback genérico (custom / meal desconocida): mezcla amplia de básicos.
const KEYWORDS_DEFAULT: string[] = [
  "pollo", "arroz", "huevo", "pan", "banana", "yogur", "carne",
  "ensalada", "fideos", "leche", "queso", "manzana",
];

/** Etiqueta de la sección de sugeridos según el momento del día. */
export function mealSuggestionLabel(mealType: string | null): string {
  switch (mealType) {
    case "morning": return "Sugeridos para la mañana";
    case "lunch": return "Sugeridos para el mediodía";
    case "snack": return "Sugeridos para la tarde";
    case "dinner": return "Sugeridos para la noche";
    default: return "Sugeridos para vos";
  }
}

/**
 * Devuelve alimentos sugeridos para un momento del día, resolviendo cada
 * keyword contra el catálogo y quedándose con el mejor match no repetido.
 */
export function suggestFoods<T extends RankableFood>(
  catalog: T[],
  mealType: string | null,
  limit = 12,
): T[] {
  if (catalog.length === 0) return [];
  const keywords = (mealType && KEYWORDS_BY_MEAL[mealType]) || KEYWORDS_DEFAULT;

  const seen = new Set<number>();
  const out: T[] = [];
  for (const kw of keywords) {
    const pick = searchFoods(catalog, kw, 3).find((m) => !seen.has(m.id));
    if (!pick) continue;
    seen.add(pick.id);
    out.push(pick);
    if (out.length >= limit) break;
  }
  return out;
}
