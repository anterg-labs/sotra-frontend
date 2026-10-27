import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { conEstadosOrden, estadosDePrueba } from "@/pruebas/estados-orden";
import type { HistorialEstadoOrdenTrabajo } from "@/tipos/orden-trabajo";
import { armarLineaDeTiempo, formatearDuracion, LineaDeTiempoOrden, RecorridoDeLaOrden } from "./linea-de-tiempo-orden";

const cambio = (estado: string, estadoAnterior: string | null, fechaHora: string, observacion: string | null = null): HistorialEstadoOrdenTrabajo => ({
  estado, estadoAnterior, fechaHora, observacion, usuarioId: 3, nombreUsuario: "Ana Pérez",
});

const ordenCompleta = [
  cambio("pendiente", null, "2026-10-01T08:00:00Z"),
  cambio("en_progreso", "pendiente", "2026-10-01T10:00:00Z"),
  cambio("pausado", "en_progreso", "2026-10-01T12:00:00Z", "Falta de repuesto"),
  cambio("en_progreso", "pausado", "2026-10-02T12:00:00Z"),
  cambio("en_revision", "en_progreso", "2026-10-02T14:00:00Z"),
  cambio("pendiente", "en_revision", "2026-10-03T14:00:00Z", "Falta revisar el sello"),
  cambio("en_progreso", "pendiente", "2026-10-03T15:00:00Z"),
  cambio("en_revision", "en_progreso", "2026-10-03T17:00:00Z"),
  cambio("cerrado", "en_revision", "2026-10-04T09:00:00Z"),
];

describe("línea de tiempo de la orden", () => {
  it("arma las etapas con la fecha de llegada, el tiempo en cada una, las pausas y las devoluciones", () => {
    const resumen = armarLineaDeTiempo(ordenCompleta, estadosDePrueba, new Date("2026-10-10T00:00:00Z"));

    expect(resumen.eliminada).toBe(false);
    expect(resumen.etapas.map((etapa) => [etapa.fase, etapa.alcanzada, etapa.actual])).toEqual([
      ["pendiente", true, false], ["en_curso", true, false], ["por_validar", true, false], ["cerrada", true, true],
    ]);
    expect(resumen.etapas[0].horas).toBeCloseTo(2 + 1, 5);
    expect(resumen.etapas[3].horas).toBeNull();
    expect(resumen.pausas).toEqual({ cantidad: 1, horas: 24, ultimoMotivo: "Falta de repuesto" });
    expect(resumen.devoluciones).toEqual({ cantidad: 1, ultimoMotivo: "Falta revisar el sello" });
  });

  it("una orden recién creada tiene una sola etapa alcanzada y cuenta el tiempo hasta ahora", () => {
    const resumen = armarLineaDeTiempo([cambio("pendiente", null, "2026-10-01T08:00:00Z")], estadosDePrueba, new Date("2026-10-01T12:00:00Z"));
    expect(resumen.etapas.map((etapa) => etapa.alcanzada)).toEqual([true, false, false, false]);
    expect(resumen.etapas[0]).toMatchObject({ actual: true, horas: 4 });
    expect(resumen.pausas.cantidad).toBe(0);
  });

  it("una orden eliminada lo informa y sin historial no hay etapas alcanzadas", () => {
    const eliminada = armarLineaDeTiempo(
      [cambio("pendiente", null, "2026-10-01T08:00:00Z"), cambio("eliminado", "pendiente", "2026-10-01T09:00:00Z", "Error")],
      estadosDePrueba,
    );
    expect(eliminada.eliminada).toBe(true);
    expect(armarLineaDeTiempo([], estadosDePrueba).etapas.every((etapa) => !etapa.alcanzada)).toBe(true);
  });

  it("da formato a las duraciones", () => {
    expect(formatearDuracion(0.4)).toBe("menos de 1 h");
    expect(formatearDuracion(5.4)).toBe("5 h");
    expect(formatearDuracion(51)).toBe("2 d 3 h");
  });

  it("muestra la barra con la etapa actual, pausas y devoluciones, sin nombres de personas", () => {
    render(conEstadosOrden(<LineaDeTiempoOrden historial={ordenCompleta} />));
    const etapas = screen.getByRole("list");
    expect(within(etapas).getAllByRole("listitem")).toHaveLength(4);
    expect(within(etapas).getByText("Cerrado").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText(/En curso con 1 pausa \(24 h en total\)\. Último motivo: Falta de repuesto/)).toBeInTheDocument();
    expect(screen.getByText(/Devuelta de revisión a pendiente 1 vez\. Último motivo: Falta revisar el sello/)).toBeInTheDocument();
    expect(screen.queryByText(/Ana Pérez/)).not.toBeInTheDocument();
  });

  it("avisa cuando la orden fue eliminada", () => {
    render(conEstadosOrden(<LineaDeTiempoOrden historial={[cambio("pendiente", null, "2026-10-01T08:00:00Z"), cambio("eliminado", "pendiente", "2026-10-01T09:00:00Z")]} />));
    expect(screen.getByRole("status")).toHaveTextContent("La orden fue eliminada");
  });
});

describe("recorrido de la orden", () => {
  it("dibuja un nodo por cada cambio, una flecha entre ellos y las vueltas atrás aparte", () => {
    const { container } = render(conEstadosOrden(<RecorridoDeLaOrden historial={ordenCompleta} />));
    expect(screen.getByRole("img", { name: "Recorrido de la orden por sus estados" })).toBeInTheDocument();
    expect(container.querySelectorAll("circle.recorrido-nodo")).toHaveLength(9);
    expect(container.querySelectorAll("path.recorrido-flecha").length).toBe(8);
    expect(container.querySelectorAll("path.recorrido-flecha-vuelta").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
    expect(screen.queryByText(/Ana Pérez/)).not.toBeInTheDocument();
  });

  it("sin historial dice que no hay recorrido", () => {
    render(conEstadosOrden(<RecorridoDeLaOrden historial={[]} />));
    expect(screen.getByText("Todavía no hay historial de estados.")).toBeInTheDocument();
  });
});
