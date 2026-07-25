import { describe, it, expect } from "vitest";
import { foodEmoji } from "./foodEmoji";

describe("foodEmoji", () => {
  it("matchea alimentos comunes", () => {
    expect(foodEmoji("Banana")).toBe("🍌");
    expect(foodEmoji("Pechuga de pollo")).toBe("🍗");
    expect(foodEmoji("Milanesa con puré")).toBe("🥩"); // milanesa gana antes que puré
    expect(foodEmoji("Arroz blanco")).toBe("🍚");
    expect(foodEmoji("Café con leche")).toBe("☕"); // café antes que leche
  });

  it("ignora acentos y mayúsculas", () => {
    expect(foodEmoji("ANANÁ")).toBe("🍍");
    expect(foodEmoji("Aceitúna")).toBe("🫒");
  });

  it("cae en el fallback si no reconoce nada", () => {
    expect(foodEmoji("xyz123")).toBe("🍽️");
    expect(foodEmoji("")).toBe("🍽️");
    expect(foodEmoji(null)).toBe("🍽️");
    expect(foodEmoji(undefined)).toBe("🍽️");
  });
});
