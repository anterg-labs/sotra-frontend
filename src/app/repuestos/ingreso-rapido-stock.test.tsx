import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IngresoRapidoStock } from "./ingreso-rapido-stock";

const m = vi.hoisted(() => ({
  registrarIngresoStockAccion: vi.fn(),
  listarRepuestosPaginados: vi.fn(),
  mostrarAviso: vi.fn(),
  avisarStockActualizado: vi.fn(),
}));

vi.mock("./acciones", () => ({ registrarIngresoStockAccion: m.registrarIngresoStockAccion }));
vi.mock("@/servicios/servicio-repuestos", () => ({ listarRepuestosPaginados: m.listarRepuestosPaginados }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: m.mostrarAviso }) }));
vi.mock("@/hooks/use-alertas-stock", () => ({ avisarStockActualizado: m.avisarStockActualizado }));

const filtro = { id: 5, codigo: "R-5", nombre: "Filtro de aceite", cantidad: 7 };
const movimiento = { id: 1, nombreRepuesto: "Filtro de aceite", cantidad: 3, stockAnterior: 7, stockPosterior: 10 };

async function elegirRepuesto() {
  fireEvent.focus(screen.getByRole("combobox", { name: "Repuesto" }));
  fireEvent.click(await screen.findByRole("option", { name: "R-5 · Filtro de aceite (stock: 7)" }));
}

describe("ingreso directo de stock", () => {
  beforeEach(() => {
    Object.values(m).forEach((f) => f.mockReset());
    m.listarRepuestosPaginados.mockResolvedValue({ elementos: [filtro] });
  });

  it("pide solo el repuesto y la cantidad, sin fecha, motivo ni ubicación", () => {
    render(<IngresoRapidoStock />);
    fireEvent.click(screen.getByRole("button", { name: "Ingresar stock" }));

    expect(screen.getByRole("combobox", { name: "Repuesto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Cantidad a ingresar")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Fecha/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Motivo/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Ubicación/)).not.toBeInTheDocument();
  });

  it("busca solo repuestos activos y los muestra con su stock actual", async () => {
    render(<IngresoRapidoStock />);
    fireEvent.click(screen.getByRole("button", { name: "Ingresar stock" }));
    await elegirRepuesto();

    expect(m.listarRepuestosPaginados).toHaveBeenCalledWith(expect.objectContaining({ estado: "activo" }));
  });

  it("registra el ingreso, avisa con el stock anterior y el nuevo y actualiza los contadores", async () => {
    m.registrarIngresoStockAccion.mockResolvedValue({ exito: true, registro: movimiento });
    render(<IngresoRapidoStock />);
    fireEvent.click(screen.getByRole("button", { name: "Ingresar stock" }));
    await elegirRepuesto();
    fireEvent.change(screen.getByLabelText("Cantidad a ingresar"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ingreso" }));

    await waitFor(() => expect(m.registrarIngresoStockAccion).toHaveBeenCalledWith(5, { cantidad: 3 }));
    await waitFor(() => expect(m.mostrarAviso).toHaveBeenCalledWith("exito", "Ingresaron 3 unidades de Filtro de aceite. Stock: 7 → 10."));
    expect(m.avisarStockActualizado).toHaveBeenCalled();
  });

  it("sin repuesto ni cantidad muestra los errores junto a cada campo y no envía", async () => {
    render(<IngresoRapidoStock />);
    fireEvent.click(screen.getByRole("button", { name: "Ingresar stock" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ingreso" }));

    expect(await screen.findByText("Elegí el repuesto al que ingresa el stock.")).toHaveAttribute("role", "alert");
    expect(screen.getByText("La cantidad a ingresar debe ser un número entero mayor a cero.")).toHaveAttribute("role", "alert");
    expect(m.registrarIngresoStockAccion).not.toHaveBeenCalled();
  });

  it("si la API falla muestra el error general y no avisa éxito", async () => {
    m.registrarIngresoStockAccion.mockResolvedValue({ exito: false, errores: {}, mensaje: "No se puede mover el stock de un repuesto dado de baja." });
    render(<IngresoRapidoStock />);
    fireEvent.click(screen.getByRole("button", { name: "Ingresar stock" }));
    await elegirRepuesto();
    fireEvent.change(screen.getByLabelText("Cantidad a ingresar"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar ingreso" }));

    expect(await screen.findByText("No se puede mover el stock de un repuesto dado de baja.")).toBeInTheDocument();
    expect(m.mostrarAviso).not.toHaveBeenCalled();
  });
});
