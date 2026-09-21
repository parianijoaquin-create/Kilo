import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import catalog from "../Informacion/alimentos_100_kilo.json";

const requiredMilanesas = [
  ["milanesa_de_carne_vacuna", "Milanesa de carne vacuna"],
  ["milanesa_de_pollo", "Milanesa de pollo"],
  ["milanesa_de_cerdo", "Milanesa de cerdo"],
] as const;

describe("catálogo obligatorio de milanesas", () => {
  it.each(requiredMilanesas)("incluye %s en los datos y en el seed SQL", (id, name) => {
    expect(catalog).toEqual(
      expect.arrayContaining([expect.objectContaining({ id, nombre_es: name })]),
    );

    const sql = readFileSync(
      new URL("../sql/foods_100_seed.sql", import.meta.url),
      "utf8",
    );
    expect(sql).toContain(`'${id}','${name}'`);
  });
});
