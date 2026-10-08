import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerIndicadores } from "@/servicios/servicio-reportes";

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
    const indicadores = await obtenerIndicadores();

    expect(indicadores.totalOrdenes).toBe(3);
    expect(indicadores.activosConMasIntervenciones[0].nombre).toBe("Excavadora 01");
    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/api/v1/reportes/indicadores", { cache: "no-store" });
  });
});
