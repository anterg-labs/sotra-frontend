import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumenPorCliente } from "./resumen-por-cliente";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/api/api-resumen-por-cliente", () => ({ apiObtenerResumenPorCliente: api }));
const filtros = { fechaDesde: "", fechaHasta: "", clienteId: "", activoId: "", estado: "", tipo: "" };
const datos = { fechaDesde: null, fechaHasta: null, diasReincidencia: 90, clientes: [
  { clienteId: 1, cliente: "Empresa Uno", ordenes: 4, correctivas: 3, correctivasCerradas: 2, horasParada: 48, reincidencias: 1 },
  { clienteId: 2, cliente: "Empresa Dos", ordenes: 7, correctivas: 1, correctivasCerradas: 1, horasParada: 10, reincidencias: 0 },
] };
beforeEach(() => api.mockReset());

describe("A13: resumen por cliente", () => {
  it("muestra barras por métrica y tabla con todas las cifras", async () => {
    api.mockResolvedValue(datos);
    render(<ResumenPorCliente filtros={filtros} />);
    expect(await screen.findByText(/Empresas ordenadas por correctivas/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    const tabla = screen.getByRole("table");
    expect(within(tabla).getByRole("rowheader", { name: "Empresa Uno" })).toBeVisible();
    expect(within(tabla).getByRole("rowheader", { name: "Empresa Dos" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Comparar por"), { target: { value: "horasParada" } });
    expect(screen.getByText(/Empresas ordenadas por horas de parada/)).toBeVisible();
    fireEvent.click(screen.getByText("Cómo se calcula"));
    expect(screen.getByText(/dentro de 90 días/)).toBeVisible();
    expect(api).toHaveBeenCalledWith(filtros);
  });
  it("distingue vacío de error y permite reintentar", async () => {
    api.mockRejectedValueOnce(new Error("No se pudo obtener."));
    api.mockResolvedValue({ ...datos, clientes: [] });
    render(<ResumenPorCliente filtros={filtros} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo obtener");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText(/No hay órdenes en el período/)).toBeVisible();
  });
});
