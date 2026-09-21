import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./authError";

describe("authErrorMessage", () => {
  it("traduce credenciales inválidas", () => {
    expect(authErrorMessage("invalid_credentials")).toBe("El email o la contraseña no son correctos.");
  });

  it("conserva un mensaje desconocido como fallback", () => {
    expect(authErrorMessage("unknown_code", "Error especial")).toBe("Error especial");
  });

  it("devuelve un mensaje seguro si no hay detalle", () => {
    expect(authErrorMessage()).toContain("No pudimos completar");
  });
});
