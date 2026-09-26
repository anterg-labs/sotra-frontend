import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  borrarSugerenciasTemporales,
  crearOrdenTrabajo,
  formatearFechaPrevista,
  guardarSugerenciasTemporales,
  leerSugerenciasTemporales,
  listarOrdenesTrabajo,
  solicitarSugerenciaOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";

describe("servicio-ordenes-trabajo", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const ordenSimulada = {
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
      estado: "creada",
      creadoEn: "2026-09-25T03:57:12.499Z",
      fechaInicio: null,
      fechaCierre: null,
      sugerencias: [],
      repuestos: [],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify([ordenSimulada]), {
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
      sugerencias: [],
      repuestosIds: [],
      estado: "creada" as const,
    };

    await expect(crearOrdenTrabajo(ordenSinDescripcion)).rejects.toThrow("La descripción de la tarea es obligatoria.");
  });

  it("muestra la fecha prevista con formato día, mes y año", () => {
    expect(formatearFechaPrevista("2026-10-01")).toBe("01/10/2026");
  });

  it("guarda, lee y borra las sugerencias temporales", () => {
    guardarSugerenciasTemporales("sugerencias-prueba", ["Texto A", "Texto B"]);
    expect(leerSugerenciasTemporales("sugerencias-prueba")).toEqual(["Texto A", "Texto B"]);

    borrarSugerenciasTemporales("sugerencias-prueba");
    expect(leerSugerenciasTemporales("sugerencias-prueba")).toBeNull();
  });

  it("no pide la sugerencia sin descripción", async () => {
    await expect(solicitarSugerenciaOrdenTrabajo({ descripcion: "  ", numero: 1 })).rejects.toThrow(
      "Escribí la descripción de la tarea para pedir la sugerencia.",
    );
  });

  it("avisa cuando la documentación no tiene información suficiente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ codigo: "SIN_CONTEXTO_TECNICO" }), { status: 422 });
      }),
    );

    await expect(solicitarSugerenciaOrdenTrabajo({ descripcion: "Configurar la red", numero: 1 })).rejects.toThrow(
      "El sistema no encontró información suficiente",
    );
  });

  it("devuelve el texto de la sugerencia", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ sugerencia: "Texto de la documentación" }), { status: 200 });
      }),
    );

    const texto = await solicitarSugerenciaOrdenTrabajo({ descripcion: "Cambiar aceite", numero: 1 });

    expect(texto).toBe("Texto de la documentación");
  });
});
