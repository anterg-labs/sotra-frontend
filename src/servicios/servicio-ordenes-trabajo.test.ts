import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  actualizarOrdenTrabajo,
  asignarTecnicoOrdenTrabajo,
  borrarSugerenciasTemporales,
  cambiarEstadoOrdenTrabajo,
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
      estado: "pendiente",
      creadoEn: "2026-09-25T03:57:12.499Z",
      fechaInicio: null,
      fechaCierre: null,
      sugerencias: [],
      repuestos: [],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const paginaSimulada = {
          elementos: [ordenSimulada],
          pagina: 1,
          tamanoPagina: 20,
          totalElementos: 1,
          totalPaginas: 1,
        };
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

  it("obtiene el listado paginado de órdenes de trabajo", async () => {
    const filtros = {
      buscar: "",
      clienteId: "",
      activoId: "",
      tecnicoId: "",
      estado: "",
      prioridad: "",
      tipo: "",
      fechaDesde: "",
      fechaHasta: "",
      conSugerencias: false,
      pagina: 1,
    };

    const respuesta = await listarOrdenesTrabajo(filtros);

    expect(respuesta.elementos).toHaveLength(1);
    expect(respuesta.elementos[0].descripcion).toBe("Cambiar aceite del motor");
    expect(respuesta.totalPaginas).toBe(1);
    expect(fetch).toHaveBeenCalledWith("/api/v1/ordenes-trabajo?pagina=1", { cache: "no-store" });
  });

  it("envía la búsqueda y los filtros completados", async () => {
    const filtros = {
      buscar: " aceite ",
      clienteId: "1",
      activoId: "",
      tecnicoId: "",
      estado: "pendiente",
      prioridad: "alta",
      tipo: "",
      fechaDesde: "",
      fechaHasta: "",
      conSugerencias: false,
      pagina: 2,
    };

    await listarOrdenesTrabajo(filtros);

    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/ordenes-trabajo?buscar=aceite&clienteId=1&estado=pendiente&prioridad=alta&pagina=2",
      { cache: "no-store" },
    );
  });

  it("envía la versión leída en If-Match al modificar una orden y lo omite si no hay versión", async () => {
    const campos = {
      clienteId: 1,
      activoId: 2,
      tecnicoId: null,
      tipo: "preventivo" as const,
      prioridad: "alta" as const,
      descripcion: "Cambiar aceite del motor",
      observaciones: "",
      fechaPrevistaEjecucion: "2026-10-01",
      sugerencias: [],
      repuestos: [],
      estado: "pendiente" as const,
      motivoEstado: "",
      sesion: "",
    };

    await actualizarOrdenTrabajo(1, campos, "a1b2c3");
    await actualizarOrdenTrabajo(1, campos);

    const [primera, segunda] = vi.mocked(fetch).mock.calls;
    expect((primera[1]?.headers as Record<string, string>)["If-Match"]).toBe('"a1b2c3"');
    expect((segunda[1]?.headers as Record<string, string>)["If-Match"]).toBeUndefined();
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
      repuestos: [],
      estado: "pendiente" as const,
      motivoEstado: "",
      sesion: "",
    };

    await expect(crearOrdenTrabajo(ordenSinDescripcion)).rejects.toThrow("La descripción de la tarea es obligatoria.");
  });

  it("no cambia el estado sin motivo cuando hace falta", async () => {
    await expect(cambiarEstadoOrdenTrabajo(1, "pausado", "  ", true)).rejects.toThrow(
      "Indicá el motivo u observación del cambio de estado.",
    );
  });

  it("envía el cambio de estado con su motivo", async () => {
    await cambiarEstadoOrdenTrabajo(1, "pausado", " Falta de repuestos ", true);

    expect(fetch).toHaveBeenCalledWith("/api/v1/ordenes-trabajo/1/estado", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "pausado", motivo: "Falta de repuestos" }),
    });
  });

  it("no asigna técnico si no se eligió ninguno", async () => {
    await expect(asignarTecnicoOrdenTrabajo(1, "")).rejects.toThrow("Seleccioná un técnico.");
  });

  it("envía la asignación del técnico", async () => {
    await asignarTecnicoOrdenTrabajo(1, "25");

    expect(fetch).toHaveBeenCalledWith("/api/v1/ordenes-trabajo/1/tecnico", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tecnicoId: 25 }),
    });
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
    await expect(solicitarSugerenciaOrdenTrabajo({ descripcion: "  ", numero: 1, sesion: "" })).rejects.toThrow(
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

    await expect(solicitarSugerenciaOrdenTrabajo({ descripcion: "Configurar la red", numero: 1, sesion: "" })).rejects.toThrow(
      "El sistema no encontró información suficiente",
    );
  });

  it("devuelve el texto de la sugerencia", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ sugerencia: "Texto de la documentación", modo: "ia" }), { status: 200 });
      }),
    );

    const sugerencia = await solicitarSugerenciaOrdenTrabajo({ descripcion: "Cambiar aceite", numero: 1, sesion: "" });

    expect(sugerencia).toEqual({ texto: "Texto de la documentación", sinIa: false });
  });

  it("indica cuando la sugerencia salió sin el asistente de IA", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ sugerencia: "Texto del manual", modo: "sin_ia" }), { status: 200 });
      }),
    );

    const sugerencia = await solicitarSugerenciaOrdenTrabajo({ descripcion: "Cambiar aceite", numero: 1, sesion: "" });

    expect(sugerencia).toEqual({ texto: "Texto del manual", sinIa: true });
  });

  it("un resumen descartado por el control de números no se avisa como IA caída", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ sugerencia: "Texto del manual", modo: "descartada" }), { status: 200 });
      }),
    );

    const sugerencia = await solicitarSugerenciaOrdenTrabajo({ descripcion: "Cambiar aceite", numero: 1, sesion: "" });

    expect(sugerencia.sinIa).toBe(false);
  });
});
