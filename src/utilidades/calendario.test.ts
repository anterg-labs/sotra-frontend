import { describe, expect, it } from "vitest";
import { esMesValido, mesDeHoy, nombreDelMes, primerDiaDelMes, semanasDelMes, sumarMeses, ultimoDiaDelMes } from "./calendario";

describe("calendario", () => {
  it("suma meses cruzando de año y valida el formato", () => {
    expect(sumarMeses("2026-11", 1)).toBe("2026-12");
    expect(sumarMeses("2026-12", 1)).toBe("2027-01");
    expect(sumarMeses("2026-01", -1)).toBe("2025-12");
    expect(sumarMeses("2026-03", 14)).toBe("2027-05");
    expect(esMesValido("2026-10")).toBe(true);
    expect(esMesValido("2026-13")).toBe(false);
    expect(esMesValido("2026-1")).toBe(false);
  });

  it("calcula el primer y el último día de meses de 28 a 31 días y de un año bisiesto", () => {
    expect(primerDiaDelMes("2026-10")).toBe("2026-10-01");
    expect(ultimoDiaDelMes("2026-10")).toBe("2026-10-31");
    expect(ultimoDiaDelMes("2026-02")).toBe("2026-02-28");
    expect(ultimoDiaDelMes("2028-02")).toBe("2028-02-29");
    expect(ultimoDiaDelMes("2026-04")).toBe("2026-04-30");
  });

  it("arma las semanas de lunes a domingo dejando vacíos los días de otros meses", () => {
    const semanas = semanasDelMes("2026-11");
    expect(semanas.every((semana) => semana.length === 7)).toBe(true);
    expect(semanas[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(semanas.flat().filter(Boolean)).toHaveLength(30);
    expect(semanas.at(-1)?.at(-1)).toBeNull();
    // Un mes que empieza en lunes no deja vacíos al principio.
    expect(semanasDelMes("2026-06")[0][0]).toBe("2026-06-01");
    // Febrero de 28 días que empieza en domingo ocupa cinco semanas.
    expect(semanasDelMes("2026-02")).toHaveLength(5);
  });

  it("nombra el mes en español y usa UTC para el mes de hoy", () => {
    expect(nombreDelMes("2026-11")).toBe("noviembre de 2026");
    expect(mesDeHoy(new Date("2026-12-31T23:30:00Z"))).toBe("2026-12");
    expect(mesDeHoy(new Date("2027-01-01T00:30:00Z"))).toBe("2027-01");
  });
});
