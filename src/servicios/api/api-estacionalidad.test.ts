import { describe, expect, it, vi } from "vitest";
import { apiObtenerEstacionalidad, leerEstacionalidad } from "./api-estacionalidad";

const leer = vi.hoisted(() => vi.fn());
vi.mock("./solicitudes-http", () => ({ leerDatosApi: leer }));
const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, correctivas: i === 0 ? 2 : 0 }));
const datos = { fechaDesde: null, fechaHasta: null, total: 2, meses,
  tipos: [{ tipoMaquinaId: 1, tipoMaquina: "Grúa", total: 2, meses }] };
describe("contrato de estacionalidad", () => {
  it("acepta los doce meses y el vacío explícito", () => {
    expect(leerEstacionalidad(datos)).toEqual(datos);
    expect(leerEstacionalidad({ ...datos, total: 0, tipos: [], meses: meses.map(m => ({ ...m, correctivas: 0 })) }).total).toBe(0);
  });
  it.each([null, { ...datos, total: 4 }, { ...datos, meses: meses.slice(1) },
    { ...datos, tipos: [...datos.tipos, ...datos.tipos] },
    { ...datos, meses: meses.map(m => ({ ...m, correctivas: -1 })) },
    { ...datos, fechaDesde: "ayer" },
    { ...datos, tipos: [{ ...datos.tipos[0], total: 1 }] },
    { ...datos, meses: [...meses].reverse() },
  ])("rechaza respuestas incompletas o incoherentes", valor => expect(() => leerEstacionalidad(valor)).toThrow(/formato esperado/));
  it("envía solo los filtros del análisis y valida el resultado", async () => {
    leer.mockResolvedValue(datos);
    await apiObtenerEstacionalidad({ fechaDesde: "2025-01-01", fechaHasta: "2026-12-31", clienteId: "3", activoId: "8", tipo: "preventivo", estado: "cerrado" });
    expect(leer).toHaveBeenCalledWith("/api/v1/reportes/estacionalidad?fechaDesde=2025-01-01&fechaHasta=2026-12-31&clienteId=3&activoId=8", { cache: "no-store" }, expect.any(String));
  });
});
