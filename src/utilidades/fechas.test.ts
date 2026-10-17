import { describe, expect, it } from "vitest";
import { formatearFechaCorta, formatearFechaHora, formatearFechaNumerica } from "./fechas";

describe("fechas de la empresa", () => {
  it("conserva el día de Montevideo cerca de medianoche UTC", () => {
    expect(formatearFechaCorta("2026-10-18T01:00:00Z")).toBe("17/10/2026");
    expect(formatearFechaNumerica("2026-10-18T01:00:00Z")).toBe("17/10/2026");
  });

  it("produce espacios estables entre Node y Chrome para no regenerar el historial al hidratar", () => {
    const texto = formatearFechaHora("2026-09-28T04:35:13.107417Z");
    expect(texto).toBe("28/9/2026, 1:35:13 a. m.");
    expect(texto).not.toMatch(/[\u00a0\u202f]/);
  });
});
