import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RepuestosPorModelo } from "./repuestos-por-modelo";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/api/api-repuestos-por-modelo", () => ({ apiObtenerRepuestosPorModelo: api }));
const filtros = { fechaDesde: "", fechaHasta: "", clienteId: "", activoId: "", estado: "", tipo: "" };
const datos = { fechaDesde: null, fechaHasta: null, modelos: [
  { modeloId: 1, modelo: "M1", tipoMaquinaId: 2, tipoMaquina: "Excavadora", repuestos: [
    { repuestoId: 5, codigo: "R-5", repuesto: "Filtro", ordenesAsociadas: 3, ordenesSuministradas: 2 },
  ] },
  { modeloId: 3, modelo: "M2", tipoMaquinaId: 2, tipoMaquina: "Excavadora", repuestos: [
    { repuestoId: 6, codigo: "R-6", repuesto: "Bomba", ordenesAsociadas: 1, ordenesSuministradas: 0 },
  ] },
] };
beforeEach(() => api.mockReset());

describe("A12: repuestos por modelo", () => {
  it("muestra la frecuencia y permite elegir otro modelo y ver la tabla", async () => {
    api.mockResolvedValue(datos);
    render(<RepuestosPorModelo filtros={filtros} />);
    expect(await screen.findByText(/En Excavadora · M1/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    const tabla = screen.getByRole("table");
    expect(within(tabla).getByRole("rowheader", { name: "Filtro" })).toBeVisible();
    expect(within(tabla).getByText("R-5")).toBeVisible();
    expect(within(tabla).getByText("3")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Modelo de máquina"), { target: { value: "3" } });
    expect(within(screen.getByRole("table")).getByRole("rowheader", { name: "Bomba" })).toBeVisible();
    fireEvent.click(screen.getByText("Cómo se calcula"));
    expect(screen.getByText(/asociación no mide unidades consumidas/i)).toBeVisible();
  });
  it("distingue vacío de error y ofrece reintento", async () => {
    api.mockRejectedValueOnce(new Error("No se pudo obtener."));
    api.mockResolvedValue({ ...datos, modelos: [] });
    render(<RepuestosPorModelo filtros={filtros} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo obtener");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText(/No hay repuestos asociados/)).toBeVisible();
  });
});
