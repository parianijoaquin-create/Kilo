import type { FoodSearchResult } from "@/context/SheetContext";

/** FoodSearchResult + campos usados solo para rankear. */
export type RankableFood = FoodSearchResult & {
  is_verified?: boolean | null;
  is_generic?: boolean | null;
};

/** minúsculas + sin acentos/diacríticos + espacios colapsados. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca tildes/diéresis
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s).split(/[^a-z0-9]+/).filter(Boolean);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Puntúa qué tan bien matchea un nombre contra la query normalizada.
 * Devuelve null si no hay match. Mayor score = mejor.
 *
 * Tiers: match exacto > empieza con la query > empieza una palabra >
 * contiene la frase > todos los tokens presentes (multi-palabra).
 * Luego bonifica verificados/genéricos y penaliza nombres largos.
 */
export function scoreFood(
  name: string,
  qNorm: string,
  qTokens: string[],
  meta?: { verified?: boolean | null; generic?: boolean | null }
): number | null {
  if (!qNorm) return null;
  const nameNorm = normalize(name);

  let score: number;
  if (nameNorm === qNorm) score = 1000;
  else if (nameNorm.startsWith(qNorm)) score = 800;
  else if (new RegExp(`\\b${escapeRe(qNorm)}`).test(nameNorm)) score = 600;
  else if (nameNorm.includes(qNorm)) score = 400;
  else {
    // multi-palabra: cada token de la query debe iniciar alguna palabra del nombre
    const nameToks = tokenize(name);
    const allPresent = qTokens.every((t) => nameToks.some((nt) => nt.startsWith(t)));
    if (!allPresent) return null;
    score = 250;
  }

  if (meta?.verified) score += 60;
  if (meta?.generic) score += 25;
  score -= Math.min(nameNorm.length, 60) * 0.5; // desempate hacia nombres simples
  return score;
}

/** Busca y rankea en memoria. Query < 2 chars → sin resultados. */
export function searchFoods<T extends RankableFood>(foods: T[], query: string, limit = 30): T[] {
  const qNorm = normalize(query);
  if (qNorm.length < 2) return [];
  const qTokens = qNorm.split(" ").filter(Boolean);

  const scored: { f: T; s: number }[] = [];
  for (const f of foods) {
    const s = scoreFood(f.canonical_name, qNorm, qTokens, {
      verified: f.is_verified,
      generic: f.is_generic,
    });
    if (s != null) scored.push({ f, s });
  }
  scored.sort((a, b) => b.s - a.s || a.f.canonical_name.length - b.f.canonical_name.length);
  return scored.slice(0, limit).map((x) => x.f);
}
