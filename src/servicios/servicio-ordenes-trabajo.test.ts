import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cambiarEstadoOrdenTrabajo,
  crearOrdenTrabajo,
  formatearFechaPrevista,
  listarOrdenesTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";

describe("servicio-ordenes-trabajo", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    function crearOrdenSimulada(estado: string) {
      return {
        id: 1,
        clienteId: 1,
        nombreCliente: "Constructora del Sur",
        activoId: 2,
        nombreActivo: "Retroexcavadora 01",
        tecnicoId: null,
        nombreTecnico: null,
        tipo: "preventivo",
        prioridad: "alta",
        descripcion: "Cambiar aceite del motor",
        observaciones: "",
        fechaPrevistaEjecucion: "2026-10-01",
        estado: estado,
        creadoEn: "2026-09-25T03:57:12.499Z",
        fechaInicio: null,
        fechaCierre: null,
        recomendacionIa: "",
      };
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async (entrada: string | URL | Request, opciones?: RequestInit) => {
        if (opciones && opciones.method === "PATCH") {
          const ordenEnEjecucion = crearOrdenSimulada("en_ejecucion");

          return new Response(JSON.stringify(ordenEnEjecucion), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify([crearOrdenSimulada("creada")]), {
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

  it("obtiene el listado de órdenes de trabajo", async () => {
    const respuesta = await listarOrdenesTrabajo();

    expect(respuesta).toHaveLength(1);
    expect(respuesta[0].descripcion).toBe("Cambiar aceite del motor");
  });

  it("no permite crear una orden sin descripción", async () => {
    const ordenSinDescripcion = {
      clienteId: 1,
      activoId: 2,
      tecnicoId: null,
      tipo: "preventivo" as const,
      prioridad: "alta" as const,
      descripcion: "",
      observaciones: "",
      fechaPrevistaEjecucion: "2026-10-01",
    };

    await expect(crearOrdenTrabajo(ordenSinDescripcion)).rejects.toThrow("La descripción de la tarea es obligatoria.");
  });

  it("cambia el estado de una orden", async () => {
    const orden = await cambiarEstadoOrdenTrabajo(1, "en_ejecucion");

    expect(orden.estado).toBe("en_ejecucion");
  });

  it("muestra la fecha prevista con formato día, mes y año", () => {
    expect(formatearFechaPrevista("2026-10-01")).toBe("01/10/2026");
  });
});
