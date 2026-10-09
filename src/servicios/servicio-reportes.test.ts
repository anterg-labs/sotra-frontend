import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerIndicadores, obtenerUrlReportePdf } from "@/servicios/servicio-reportes";

describe("servicio-reportes", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const indicadoresSimulados = {
      totalOrdenes: 3,
      ordenesPorEstado: [{ nombre: "creada", cantidad: 3 }],
      ordenesPorPrioridad: [{ nombre: "alta", cantidad: 3 }],
      ordenesPorTipo: [{ nombre: "correctivo", cantidad: 3 }],
      ordenesPorTecnico: [],
      activosConMasIntervenciones: [{ nombre: "Excavadora 01", cantidad: 3 }],
      repuestosBajoStock: [],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify(indicadoresSimulados), {
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

  it("obtiene los indicadores desde la ruta de reportes", async () => {
    const filtrosVacios = {
      fechaDesde: "",
      fechaHasta: "",
      tecnicoId: "",
      clienteId: "",
      activoId: "",
      estado: "",
      tipo: "",
    };

    const indicadores = await obtenerIndicadores(filtrosVacios);

    expect(indicadores.totalOrdenes).toBe(3);
    expect(indicadores.activosConMasIntervenciones[0].nombre).toBe("Excavadora 01");
    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/api/v1/reportes/indicadores", { cache: "no-store" });
  });

  it("envía solo los filtros completados", async () => {
    const filtros = {
      fechaDesde: "2026-01-01",
      fechaHasta: "2026-12-31",
      tecnicoId: "",
      clienteId: "4",
      activoId: "",
      estado: "en_ejecucion",
      tipo: "preventivo",
    };

    await obtenerIndicadores(filtros);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/reportes/indicadores?fechaDesde=2026-01-01&fechaHasta=2026-12-31&clienteId=4&estado=en_ejecucion&tipo=preventivo",
      { cache: "no-store" },
    );
  });

  it("arma la dirección del reporte en PDF con los filtros completados", () => {
    const filtros = {
      fechaDesde: "2026-01-01",
      fechaHasta: "",
      tecnicoId: "",
      clienteId: "4",
      activoId: "",
      estado: "",
      tipo: "",
    };

    const url = obtenerUrlReportePdf("ordenes-trabajo", filtros, "alta");

    expect(url).toBe(
      "http://localhost:4000/api/v1/reportes/ordenes-trabajo/pdf?fechaDesde=2026-01-01&clienteId=4&prioridad=alta",
    );
  });
});
