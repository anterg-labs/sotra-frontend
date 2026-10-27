import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PanelAnalitica } from "./panel-analitica";

const obtenerTendencias = vi.hoisted(() => vi.fn());
const obtenerTiempos = vi.hoisted(() => vi.fn());
const obtenerReincidencias = vi.hoisted(() => vi.fn());
const obtenerAlertasMaquinaria = vi.hoisted(() => vi.fn());
const obtenerRepuestosUsados = vi.hoisted(() => vi.fn());
const obtenerDesempeno = vi.hoisted(() => vi.fn());

vi.mock("@/servicios/servicio-reportes", async (importarOriginal) => ({
  ...await importarOriginal<typeof import("@/servicios/servicio-reportes")>(),
  obtenerTendencias,
  obtenerTiempos,
  obtenerReincidencias,
  obtenerAlertasMaquinaria,
  obtenerRepuestosUsados,
  obtenerDesempeno,
}));

const filtros = { fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "" };

const duracion = (cantidad: number, promedio: number | null, mediana: number | null) =>
  ({ cantidad, promedioHoras: promedio, medianaHoras: mediana, percentil90Horas: promedio });

const desempenoConDatos = {
  ordenes: { creadas: 12, cerradas: 7, eliminadas: 1, abiertas: 4, preventivas: 3, correctivas: 9, porcentajePreventivas: 25 },
  tiempos: { respuesta: duracion(10, 5, 4), ejecucion: duracion(7, 30, 26), revision: duracion(6, 12, 10) },
  flujo: {
    pausas: { cantidad: 4, ordenesConPausa: 3, duracionPromedioHoras: 18, motivos: [{ texto: "Falta de repuesto", cantidad: 3 }, { texto: "Lluvia", cantidad: 1 }] },
    devoluciones: { cantidad: 2, ordenesDevueltas: 2, porcentajeDeOrdenes: 16.67, motivos: [{ texto: "Falta revisar el sello", cantidad: 2 }] },
    reasignaciones: { cantidad: 3, ordenesReasignadas: 2 },
  },
  maquinaria: {
    porTipo: [{ id: 1, nombre: "Retroexcavadora", cliente: null, ordenes: 8, correctivas: 6, preventivas: 2, horasPromedioEjecucion: 20, horasParada: 96 }],
    activos: [{ id: 4, nombre: "Retro 1", cliente: "Constructora Sur", ordenes: 5, correctivas: 4, preventivas: 1, horasPromedioEjecucion: 22, horasParada: 72 }],
  },
};

function prepararRespuestas() {
  obtenerDesempeno.mockResolvedValue(desempenoConDatos);
  obtenerTendencias.mockResolvedValue({
    agrupacion: "semana",
    puntos: [
      { periodo: "2026-10-05", preventivas: 1, correctivas: 3, total: 4 },
      { periodo: "2026-10-12", preventivas: 2, correctivas: 0, total: 2 },
    ],
    totalPeriodo: 6,
    totalPeriodoAnterior: 4,
  });
  obtenerTiempos.mockResolvedValue({
    duracion: { cantidad: 3, promedioHoras: 52, medianaHoras: 40, percentil90Horas: 130 },
    etapas: [{ estado: "pausado", cantidad: 2, promedioHoras: 61 }],
    cumplimiento: { evaluadas: 4, enPlazo: 3, porcentajeEnPlazo: 75, atrasoPromedioDias: 2 },
  });
  obtenerRepuestosUsados.mockResolvedValue({ elementos: [{ repuestoId: 1, codigo: "FIL-1", nombre: "Filtro", ordenes: 3 }] });
  obtenerReincidencias.mockResolvedValue({
    dias: 90,
    minimo: 1,
    elementos: [{
      activoId: 4, nombreActivo: "Retroexcavadora 1", cliente: "Constructora Sur", correctivas: 5, reincidencias: 3,
      diasPromedioEntreIntervenciones: 41.2, ultimaIntervencion: "2026-10-10T14:20:00Z",
    }],
  });
  obtenerAlertasMaquinaria.mockResolvedValue({
    total: 1,
    criticas: 1,
    alertas: [{
      tipo: "sin_asignar", gravedad: "critica", ordenId: 45, activoId: 4, nombreActivo: "Retroexcavadora 1",
      cliente: "Constructora Sur", estado: "pendiente", prioridad: "alta", horasTranscurridas: 60, umbralHoras: 24,
    }],
  });
}

describe("PanelAnalitica", () => {
  beforeEach(() => {
    [obtenerTendencias, obtenerTiempos, obtenerReincidencias, obtenerAlertasMaquinaria, obtenerRepuestosUsados, obtenerDesempeno].forEach((mock) => mock.mockReset());
    prepararRespuestas();
  });

  it("muestra alertas, tendencias con variación, tiempos y reincidencias", async () => {
    render(<PanelAnalitica filtros={filtros} />);

    const alertas = await screen.findByRole("status");
    expect(within(alertas).getByText("Orden sin asignar")).toBeInTheDocument();
    expect(within(alertas).getByRole("link", { name: "Ver orden #45" })).toHaveAttribute("href", "/ordenes-trabajo/45");
    expect(within(alertas).getByText("Crítica")).toBeInTheDocument();
    expect(screen.getByText(/▲ \+50 % contra el período anterior \(4\)/)).toBeInTheDocument();
    expect(screen.getByText("2 d 4 h")).toBeInTheDocument();
    expect(screen.getByText("Pausado")).toBeInTheDocument();
    expect(screen.getByText("75 %")).toBeInTheDocument();
    expect(screen.getByText(/3 de 4 en plazo · atraso promedio 2 d/)).toBeInTheDocument();
    expect(screen.getByText("FIL-1 · Filtro")).toBeInTheDocument();
    expect(screen.getByText("3 órdenes")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retroexcavadora 1" })).toHaveAttribute("href", "/activos/4");
    expect(screen.getByRole("img", { name: /Órdenes creadas por semana/ })).toBeInTheDocument();
  });

  it("muestra el desempeño operativo de órdenes, procesos y maquinaria sin comparar personas", async () => {
    render(<PanelAnalitica filtros={filtros} />);

    const seccion = (await screen.findByRole("heading", { name: /Desempeño operativo/ })).closest("section") as HTMLElement;
    const dentro = within(seccion);
    expect(await dentro.findByText("12")).toBeInTheDocument();
    expect(dentro.getByText("7 cerradas · 4 abiertas · 1 eliminadas")).toBeInTheDocument();
    expect(dentro.getByText("25 %")).toBeInTheDocument();
    expect(dentro.getByText("5 h")).toBeInTheDocument();
    expect(dentro.getByText(/3 órdenes · duración promedio 18 h/)).toBeInTheDocument();
    expect(dentro.getByText("Falta de repuesto")).toBeInTheDocument();
    expect(dentro.getByText("Falta revisar el sello")).toBeInTheDocument();
    expect(dentro.getByText(/2 órdenes · 16.67 % de las creadas/)).toBeInTheDocument();
    expect(dentro.getByText(/2 órdenes con cambio de técnico/)).toBeInTheDocument();
    expect(dentro.getByText("Retroexcavadora")).toBeInTheDocument();
    expect(dentro.getAllByRole("button", { name: /Horas de parada/ })).toHaveLength(2);
    expect(dentro.getByRole("link", { name: "Retro 1" })).toHaveAttribute("href", "/activos/4");
    expect(dentro.getByText("3 d")).toBeInTheDocument();
    expect(dentro.getByText(/no compara personas/)).toBeInTheDocument();
  });

  it("el desempeño sin órdenes muestra estados vacíos y «Sin datos» en lugar de porcentajes", async () => {
    obtenerDesempeno.mockResolvedValue({
      ordenes: { creadas: 0, cerradas: 0, eliminadas: 0, abiertas: 0, preventivas: 0, correctivas: 0, porcentajePreventivas: null },
      tiempos: { respuesta: duracion(0, null, null), ejecucion: duracion(0, null, null), revision: duracion(0, null, null) },
      flujo: {
        pausas: { cantidad: 0, ordenesConPausa: 0, duracionPromedioHoras: null, motivos: [] },
        devoluciones: { cantidad: 0, ordenesDevueltas: 0, porcentajeDeOrdenes: null, motivos: [] },
        reasignaciones: { cantidad: 0, ordenesReasignadas: 0 },
      },
      maquinaria: { porTipo: [], activos: [] },
    });
    render(<PanelAnalitica filtros={filtros} />);

    expect(await screen.findByText("No hubo pausas en este período.")).toBeInTheDocument();
    expect(screen.getByText("No hubo devoluciones a pendiente en este período.")).toBeInTheDocument();
    expect(screen.getAllByText("Todavía no hay órdenes en este período.")).toHaveLength(2);
    expect(screen.getAllByText("Sin datos").length).toBeGreaterThan(0);
  });

  it("si falla el desempeño muestra su error sin tumbar los demás bloques", async () => {
    obtenerDesempeno.mockRejectedValue(new Error("No se pudo obtener el desempeño operativo."));
    render(<PanelAnalitica filtros={filtros} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo obtener el desempeño operativo.");
    expect(screen.getByText("Orden sin asignar")).toBeInTheDocument();
  });

  it("pide los datos con los filtros y vuelve a pedir las tendencias al cambiar la agrupación", async () => {
    render(<PanelAnalitica filtros={{ ...filtros, clienteId: "3" }} />);
    await screen.findByRole("status");

    expect(obtenerTendencias).toHaveBeenLastCalledWith(expect.objectContaining({ clienteId: "3" }), "semana");
    fireEvent.click(screen.getByRole("button", { name: "Por mes" }));

    await waitFor(() => expect(obtenerTendencias).toHaveBeenLastCalledWith(expect.objectContaining({ clienteId: "3" }), "mes"));
  });

  it("muestra estados vacíos útiles cuando no hay datos", async () => {
    obtenerAlertasMaquinaria.mockResolvedValue({ total: 0, criticas: 0, alertas: [] });
    obtenerTendencias.mockResolvedValue({ agrupacion: "semana", puntos: [], totalPeriodo: 0, totalPeriodoAnterior: null });
    obtenerTiempos.mockResolvedValue({
      duracion: { cantidad: 0, promedioHoras: null, medianaHoras: null, percentil90Horas: null }, etapas: [],
      cumplimiento: { evaluadas: 0, enPlazo: 0, porcentajeEnPlazo: null, atrasoPromedioDias: null },
    });
    obtenerRepuestosUsados.mockResolvedValue({ elementos: [] });
    obtenerReincidencias.mockResolvedValue({ dias: 90, minimo: 1, elementos: [] });
    render(<PanelAnalitica filtros={filtros} />);

    expect(await screen.findByText(/Todo al día/)).toBeInTheDocument();
    expect(screen.getByText("No hay órdenes en el período.")).toBeInTheDocument();
    expect(screen.getByText(/Todavía no hay tramos terminados/)).toBeInTheDocument();
    expect(screen.getByText("Ningún activo tiene correctivas repetidas en 90 días.")).toBeInTheDocument();
    expect(screen.getByText(/Todavía no hay órdenes cerradas con fecha prevista/)).toBeInTheDocument();
    expect(screen.getByText(/Todavía no hay repuestos asociados/)).toBeInTheDocument();
  });

  it("un bloque que falla muestra su error sin tumbar a los demás", async () => {
    obtenerTiempos.mockRejectedValue(new Error("No se pudieron obtener los tiempos."));
    render(<PanelAnalitica filtros={filtros} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron obtener los tiempos.");
    expect(screen.getByText("Orden sin asignar")).toBeInTheDocument();
  });
});
