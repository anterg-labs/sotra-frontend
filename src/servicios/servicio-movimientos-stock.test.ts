import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listarMovimientosStock, registrarIngresoStock } from "@/servicios/servicio-movimientos-stock";

describe("servicio-movimientos-stock", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const paginaSimulada = {
      elementos: [],
      pagina: 1,
      tamanoPagina: 20,
      totalElementos: 0,
      totalPaginas: 0,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify(paginaSimulada), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("pide los movimientos con los filtros completados", async () => {
    const filtros = {
      buscar: "",
      repuestoId: "3",
      tipo: "ingreso",
      fechaDesde: "",
      fechaHasta: "",
      ubicacion: " Depósito A ",
      usuarioId: "",
      pagina: 1,
    };

    await listarMovimientosStock(filtros);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/movimientos-stock?repuestoId=3&tipo=ingreso&ubicacion=Dep%C3%B3sito+A&pagina=1",
      { cache: "no-store" },
    );
  });

  it("no registra un ingreso con cantidad cero", async () => {
    const ingreso = { cantidad: 0, fecha: "2026-10-01", motivo: "Compra", ubicacion: "Depósito", observaciones: "" };

    await expect(registrarIngresoStock(3, ingreso)).rejects.toThrow(
      "La cantidad a ingresar debe ser un número entero mayor a cero.",
    );
  });

  it("no registra un ingreso sin motivo", async () => {
    const ingreso = { cantidad: 5, fecha: "2026-10-01", motivo: " ", ubicacion: "Depósito", observaciones: "" };

    await expect(registrarIngresoStock(3, ingreso)).rejects.toThrow("Indicá el motivo del ingreso.");
  });

  it("envía el ingreso al repuesto", async () => {
    const ingreso = { cantidad: 5, fecha: "2026-10-01", motivo: "Compra", ubicacion: "Depósito", observaciones: "" };

    await registrarIngresoStock(3, ingreso);

    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/api/v1/repuestos/3/ingresos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ingreso),
    });
  });
});
