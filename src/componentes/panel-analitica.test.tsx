import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PanelAnalitica } from "./panel-analitica";

const obtenerTendencias = vi.hoisted(() => vi.fn());
const obtenerTiempos = vi.hoisted(() => vi.fn());
const obtenerReincidencias = vi.hoisted(() => vi.fn());
const obtenerAlertasMaquinaria = vi.hoisted(() => vi.fn());
const obtenerRepuestosUsados = vi.hoisted(() => vi.fn());

vi.mock("@/servicios/servicio-reportes", async (importarOriginal) => ({
  ...await importarOriginal<typeof import("@/servicios/servicio-reportes")>(),
  obtenerTendencias,
  obtenerTiempos,
  obtenerReincidencias,
  obtenerAlertasMaquinaria,
  obtenerRepuestosUsados,
}));

const filtros = { fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "" };

function prepararRespuestas() {
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
    [obtenerTendencias, obtenerTiempos, obtenerReincidencias, obtenerAlertasMaquinaria, obtenerRepuestosUsados].forEach((mock) => mock.mockReset());
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
