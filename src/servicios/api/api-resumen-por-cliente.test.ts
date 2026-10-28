import { describe, expect, it, vi } from "vitest";
import { apiObtenerResumenPorCliente, leerResumenPorCliente } from "./api-resumen-por-cliente";

const leer = vi.hoisted(() => vi.fn());
vi.mock("./solicitudes-http", () => ({ leerDatosApi: leer }));
const cliente = { clienteId: 4, cliente: "Empresa", ordenes: 5, correctivas: 3,
  correctivasCerradas: 2, horasParada: 48, reincidencias: 1 };
const datos = { fechaDesde: null, fechaHasta: null, diasReincidencia: 90, clientes: [cliente] };

describe("contrato A13: resumen por cliente", () => {
  it("acepta el desglose y el vacío", () => {
    expect(leerResumenPorCliente(datos)).toEqual(datos);
    expect(leerResumenPorCliente({ ...datos, clientes: [] }).clientes).toEqual([]);
  });
  it.each([null, { ...datos, diasReincidencia: 0 }, { ...datos, clientes: [cliente, cliente] },
    { ...datos, clientes: [{ ...cliente, correctivas: 6 }] },
    { ...datos, clientes: [{ ...cliente, correctivasCerradas: 4 }] },
    { ...datos, clientes: [{ ...cliente, reincidencias: 4 }] },
    { ...datos, clientes: [{ ...cliente, horasParada: -1 }] },
    { ...datos, fechaDesde: "ayer" },
  ])("rechaza datos incompletos o imposibles", valor => expect(() => leerResumenPorCliente(valor)).toThrow(/formato esperado/));
  it("envía solo los filtros compartidos", async () => {
    leer.mockResolvedValue(datos);
    await apiObtenerResumenPorCliente({ fechaDesde: "2026-01-01", fechaHasta: "2026-01-31", clienteId: "3", activoId: "4", estado: "cerrado", tipo: "preventivo" });
    expect(leer).toHaveBeenCalledWith("/api/v1/reportes/resumen-por-cliente?fechaDesde=2026-01-01&fechaHasta=2026-01-31&clienteId=3&activoId=4", { cache: "no-store" }, expect.any(String));
  });
});
