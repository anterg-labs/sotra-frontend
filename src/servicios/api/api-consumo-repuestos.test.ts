import { describe, expect, it, vi } from "vitest";
import { apiObtenerConsumoDeRepuestos, leerConsumoDeRepuestos } from "./api-consumo-repuestos";

const leer = vi.hoisted(() => vi.fn());
vi.mock("./solicitudes-http", () => ({ leerDatosApi: leer }));
const repuesto = { repuestoId: 5, codigo: "R-5", repuesto: "Filtro", unidades: 10, ordenes: 3 };
const datos = { fechaDesde: null, fechaHasta: null, totalUnidades: 10, repuestos: [repuesto] };

describe("contrato: consumo de repuestos", () => {
  it("acepta cantidades reales y vacío", () => {
    expect(leerConsumoDeRepuestos(datos)).toEqual(datos);
    expect(leerConsumoDeRepuestos({ ...datos, totalUnidades: 0, repuestos: [] }).repuestos).toEqual([]);
  });
  it.each([null, { ...datos, totalUnidades: 3 },
    { ...datos, repuestos: [repuesto, repuesto], totalUnidades: 20 },
    { ...datos, repuestos: [{ ...repuesto, unidades: -1 }] },
    { ...datos, repuestos: [{ ...repuesto, unidades: 1.5 }], totalUnidades: 1.5 },
    { ...datos, fechaDesde: "ayer" },
  ])("rechaza respuestas incoherentes", valor => expect(() => leerConsumoDeRepuestos(valor)).toThrow(/formato esperado/));
  it("envía filtros de fecha, cliente y activo", async () => {
    leer.mockResolvedValue(datos);
    await apiObtenerConsumoDeRepuestos({ fechaDesde: "2026-01-01", fechaHasta: "2026-01-31", clienteId: "3", activoId: "4", estado: "cerrado", tipo: "preventivo" });
    expect(leer).toHaveBeenCalledWith("/api/v1/reportes/consumo-repuestos?fechaDesde=2026-01-01&fechaHasta=2026-01-31&clienteId=3&activoId=4", { cache: "no-store" }, expect.any(String));
  });
});
