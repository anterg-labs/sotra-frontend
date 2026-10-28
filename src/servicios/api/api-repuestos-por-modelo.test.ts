import { describe, expect, it, vi } from "vitest";
import { apiObtenerRepuestosPorModelo, leerRepuestosPorModelo } from "./api-repuestos-por-modelo";

const leer = vi.hoisted(() => vi.fn());
vi.mock("./solicitudes-http", () => ({ leerDatosApi: leer }));
const repuesto = { repuestoId: 5, codigo: "R-5", repuesto: "Filtro", ordenesAsociadas: 3, ordenesSuministradas: 2 };
const modelo = { modeloId: 7, modelo: "M1", tipoMaquinaId: 9, tipoMaquina: "Excavadora", repuestos: [repuesto] };
const datos = { fechaDesde: null, fechaHasta: null, modelos: [modelo] };

describe("contrato A12: repuestos por modelo", () => {
  it("acepta el desglose y un período vacío", () => {
    expect(leerRepuestosPorModelo(datos)).toEqual(datos);
    expect(leerRepuestosPorModelo({ ...datos, modelos: [] }).modelos).toEqual([]);
  });
  it.each([null, { ...datos, modelos: [modelo, modelo] },
    { ...datos, modelos: [{ ...modelo, repuestos: [repuesto, repuesto] }] },
    { ...datos, modelos: [{ ...modelo, repuestos: [{ ...repuesto, ordenesSuministradas: 4 }] }] },
    { ...datos, modelos: [{ ...modelo, repuestos: [] }] },
    { ...datos, fechaDesde: "ayer" },
  ])("rechaza respuestas incoherentes", valor => expect(() => leerRepuestosPorModelo(valor)).toThrow(/formato esperado/));
  it("envía filtros compartidos sin estado ni tipo", async () => {
    leer.mockResolvedValue(datos);
    await apiObtenerRepuestosPorModelo({ fechaDesde: "2026-01-01", fechaHasta: "2026-01-31", clienteId: "3", activoId: "4", estado: "cerrado", tipo: "preventivo" });
    expect(leer).toHaveBeenCalledWith("/api/v1/reportes/repuestos-por-modelo?fechaDesde=2026-01-01&fechaHasta=2026-01-31&clienteId=3&activoId=4", { cache: "no-store" }, expect.any(String));
  });
});
