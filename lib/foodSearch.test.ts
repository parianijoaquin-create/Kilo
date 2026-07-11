import { describe, it, expect } from "vitest";
import { normalize, searchFoods, type RankableFood } from "./foodSearch";

function food(name: string, extra: Partial<RankableFood> = {}): RankableFood {
  return {
    id: Math.random(), source_food_id: name, canonical_name: name,
    kcal_100g: 0, protein_g_100g: 0, carbs_g_100g: 0, fat_g_100g: 0,
    fiber_g_100g: 0, default_portion_g: 100, default_portion_name: "1 porción",
    ...extra,
  };
}

describe("normalize", () => {
  it("saca acentos, baja a minúsculas y colapsa espacios", () => {
    expect(normalize("Plátano  Crudo")).toBe("platano crudo");
    expect(normalize("  Café ")).toBe("cafe");
    expect(normalize("JAMÓN")).toBe("jamon");
  });
});

describe("searchFoods", () => {
  const catalog = [
    food("Plátano crudo"), food("Banana"), food("Manzana"),
    food("Manzana cruda"), food("Sidra de manzana"),
    food("Leche descremada"), food("Leche entera"),
    food("Café con leche"),
  ];

  it("es insensible a acentos", () => {
    const r = searchFoods(catalog, "platano");
    expect(r[0].canonical_name).toBe("Plátano crudo");
  });

  it("prioriza el match exacto sobre 'contiene'", () => {
    const r = searchFoods(catalog, "manzana");
    expect(r[0].canonical_name).toBe("Manzana");
  });

  it("soporta búsqueda multi-palabra por prefijo de tokens", () => {
    const r = searchFoods(catalog, "leche desc");
    expect(r[0].canonical_name).toBe("Leche descremada");
  });

  it("query de menos de 2 caracteres devuelve vacío", () => {
    expect(searchFoods(catalog, "a")).toEqual([]);
    expect(searchFoods(catalog, "")).toEqual([]);
  });

  it("sin coincidencias devuelve vacío", () => {
    expect(searchFoods(catalog, "zzzzz")).toEqual([]);
  });

  it("respeta el límite", () => {
    expect(searchFoods(catalog, "a", 3).length).toBeLessThanOrEqual(3);
    expect(searchFoods(catalog, "manzana", 1).length).toBe(1);
  });

  it("bonifica verificados ante nombres en el mismo tier", () => {
    const c = [
      food("Yogur descremado", { is_verified: false }),
      food("Yogur entero", { is_verified: true }),
    ];
    // "yogur" es prefijo de ambos (mismo tier); el verificado debe rankear primero
    const r = searchFoods(c, "yogur");
    expect(r[0].is_verified).toBe(true);
  });
});
