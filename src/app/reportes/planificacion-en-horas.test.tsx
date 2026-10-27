import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Planificacion } from "@/tipos/reporte";
import { BarrasDeHoras, PlanificacionEnHoras, PlanificacionPorTipo } from "./planificacion-en-horas";

const api = vi.hoisted(() => ({ apiObtenerComparativa: vi.fn() }));
vi.mock("@/servicios/api/api-reportes", () => api);
const filtros = { fechaDesde: "2026-10-01", fechaHasta: "2026-10-31", clienteId: "3", activoId: "", estado: "", tipo: "" };
const resumen = { ordenesCerradas: 2, horasPreventivas: 10, horasCorrectivas: 30, horasTotales: 40, porcentajePlanificado: 25 };
const datos: Planificacion = {
  periodo: { desde: "2026-10-01", hasta: "2026-10-31" }, resumen,
  porMes: [{ periodo: "2026-10-01", resumen }],
  porTipo: [{ id: 7, nombre: "Retroexcavadora", resumen }],
};

describe("mantenimiento planificado en horas", () => {
  it("muestra la tarjeta, comparación, tendencia y barras con alternativa tabular y explicación", async () => {
    api.apiObtenerComparativa.mockResolvedValue({ periodo: datos.periodo, metricas: [{
      codigo: "planificado_horas_porcentaje", actual: 25, anterior: 50, variacionPorcentual: -50,
      mejorSiSube: true, muestra: 2, serie: [{ periodo: "2026-09-01", valor: 50 }, { periodo: "2026-10-01", valor: 25 }],
    }] });
    render(<PlanificacionEnHoras datos={datos} filtros={filtros} />);
    expect(await screen.findByText("25 %", { selector: "p" })).toBeVisible();
    expect(screen.getByText("-50 % frente al período anterior")).toHaveClass("grafico-tono-malo");
    expect(api.apiObtenerComparativa).toHaveBeenCalledWith(filtros);
    expect(screen.getByRole("img", { name: "2026-10: 40 horas totales" })).toBeVisible();
    expect(screen.getByRole("img", { name: /Tendencia de seis meses/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    const tabla = screen.getByRole("table");
    expect(within(tabla).getByText("10")).toBeVisible();
    expect(within(tabla).getByText("30")).toBeVisible();
    expect(within(tabla).getByText("40")).toBeVisible();
    fireEvent.click(screen.getByText("Cómo se calcula"));
    expect(screen.getByText(/es tiempo transcurrido, no horas efectivas de trabajo/)).toBeVisible();
  });

  it("distingue el estado sin horas del porcentaje cero y permite reintentar la comparación", async () => {
    api.apiObtenerComparativa.mockRejectedValueOnce(new Error("No se pudo comparar."));
    api.apiObtenerComparativa.mockResolvedValue({ periodo: datos.periodo, metricas: [{
      codigo: "planificado_horas_porcentaje", actual: null, variacionPorcentual: null,
      mejorSiSube: true, muestra: 0, serie: [],
    }] });
    render(<PlanificacionEnHoras datos={{ ...datos, porMes: [], porTipo: [] }} filtros={filtros} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo comparar.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Sin dato")).toBeVisible();
    expect(screen.getByText("No hay horas de órdenes cerradas en el período.")).toBeVisible();
  });

  it("las barras apilan las horas sobre una escala común sin estilos en línea", () => {
    render(<BarrasDeHoras elementos={datos.porMes} />);
    const grafica = screen.getByRole("img");
    const rectangulos = grafica.querySelectorAll("rect");
    expect(rectangulos[0]).toHaveAttribute("width", "150");
    expect(rectangulos[1]).toHaveAttribute("x", "150");
    expect(rectangulos[1]).toHaveAttribute("width", "450");
    expect(grafica.querySelector("[style]")).toBeNull();
  });

  it("desglosa las horas por tipo de máquina y muestra 0 % como dato válido", () => {
    render(<PlanificacionPorTipo datos={{ ...datos, porTipo: [{ id: 7, nombre: "Retroexcavadora", resumen: { ...resumen, horasPreventivas: 0, porcentajePlanificado: 0 } }] }} />);
    expect(screen.getByRole("table")).toHaveTextContent("Retroexcavadora");
    expect(screen.getByRole("table")).toHaveTextContent("0 %");
  });
});
