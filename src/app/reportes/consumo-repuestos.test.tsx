import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsumoRepuestos } from "./consumo-repuestos";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/api/api-consumo-repuestos", () => ({ apiObtenerConsumoDeRepuestos: api }));
const filtros = { fechaDesde: "", fechaHasta: "", clienteId: "", activoId: "", estado: "", tipo: "" };
const datos = { fechaDesde: null, fechaHasta: null, totalUnidades: 10,
  repuestos: [{ repuestoId: 5, codigo: "R-5", repuesto: "Filtro", unidades: 10, ordenes: 3 }] };
beforeEach(() => api.mockReset());

describe("consumo de repuestos", () => {
  it("muestra unidades y distingue las órdenes", async () => {
    api.mockResolvedValue(datos);
    render(<ConsumoRepuestos filtros={filtros} />);
    expect(await screen.findByText(/10 unidades descontadas/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    const tabla = screen.getByRole("table");
    expect(within(tabla).getByRole("rowheader", { name: "Filtro" })).toBeVisible();
    expect(within(tabla).getByText("R-5")).toBeVisible();
    expect(within(tabla).getByText("3")).toBeVisible();
    fireEvent.click(screen.getByText("Cómo se calcula"));
    expect(screen.getByText(/fecha UTC del egreso/)).toBeVisible();
  });
  it("muestra vacío y permite reintentar tras error", async () => {
    api.mockRejectedValueOnce(new Error("No se pudo obtener."));
    api.mockResolvedValue({ ...datos, totalUnidades: 0, repuestos: [] });
    render(<ConsumoRepuestos filtros={filtros} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo obtener");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText(/No hubo unidades descontadas/)).toBeVisible();
  });
});
