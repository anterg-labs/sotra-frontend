import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrdenComprometida, Repuesto } from "@/tipos/repuesto";
import { PanelStock } from "./panel-stock";

const listarOrdenesComprometidas = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/hooks/use-alertas-stock", () => ({ avisarStockActualizado: vi.fn() }));
vi.mock("@/servicios/servicio-repuestos", () => ({
  listarOrdenesComprometidas: (id: number, estado?: string) => listarOrdenesComprometidas(id, estado),
}));
vi.mock("../acciones", () => ({ registrarIngresoStockAccion: vi.fn() }));

function repuesto(reservada: number, entregada: number): Repuesto {
  return {
    id: 7, codigo: "FIL-ACE-CAM", nombre: "Filtro de aceite", descripcion: "", marca: "Fleetguard", ubicacion: "Depósito A-2", categoria: "Filtros",
    modeloCompatibilidad: "", unidadMedida: "unidad", observaciones: "", cantidad: 9, cantidadMinima: 4, cantidadReservada: reservada,
    cantidadEntregada: entregada, cantidadDisponible: 9 - reservada - entregada, estado: "activo", estadoStock: "normal",
  };
}

const reservadas: OrdenComprometida[] = [
  {
    ordenId: 52, estadoRepuesto: "reservado", cantidad: 2, estadoOrden: "pendiente", nombreCliente: "Volcadores SA", nombreActivo: "SKT20",
    nombreTecnico: "Ana Pérez", fechaPrevistaEjecucion: "2026-11-15", desde: "2026-11-08T13:00:00Z",
  },
  {
    ordenId: 60, estadoRepuesto: "reservado", cantidad: 1, estadoOrden: "pendiente", nombreCliente: "Hormigones del Sur", nombreActivo: "Mixer 12",
    nombreTecnico: null, fechaPrevistaEjecucion: "2026-11-20", desde: null,
  },
];

describe("Órdenes que tienen reservado un repuesto", () => {
  beforeEach(() => {
    listarOrdenesComprometidas.mockReset();
  });

  it("al tocar el número de reservado muestra solo las órdenes que lo tienen reservado", async () => {
    listarOrdenesComprometidas.mockResolvedValue(reservadas);
    render(<PanelStock abrirIngreso={false} repuesto={repuesto(3, 1)} />);

    fireEvent.click(screen.getByRole("button", { name: /Reservado: 3/ }));

    const dialogo = await screen.findByRole("dialog", { name: "Órdenes con este repuesto reservado" });
    expect(listarOrdenesComprometidas).toHaveBeenCalledWith(7, "reservado");
    const filas = await within(dialogo).findAllByRole("row");
    expect(filas).toHaveLength(3);
    expect(within(filas[1]).getByRole("link", { name: "Ver la orden 52" })).toHaveAttribute("href", "/ordenes-trabajo/52");
    expect(within(filas[1]).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(filas[1]).getByText("SKT20")).toBeInTheDocument();
    expect(within(filas[1]).getByText("08/11/2026")).toBeInTheDocument();
    expect(within(filas[2]).getByRole("link", { name: "Ver la orden 60" })).toHaveAttribute("href", "/ordenes-trabajo/60");
    expect(within(filas[2]).getByText("Sin asignar")).toBeInTheDocument();
    expect(within(filas[2]).getByText("—")).toBeInTheDocument();
  });

  it("el disponible y el entregado ya no se pueden tocar", () => {
    render(<PanelStock abrirIngreso={false} repuesto={repuesto(3, 1)} />);

    expect(screen.getAllByRole("button", { name: /Ver las órdenes/ })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Disponible para órdenes/ })).not.toBeInTheDocument();
  });

  it("si no hay nada reservado el número no se puede tocar", () => {
    render(<PanelStock abrirIngreso={false} repuesto={repuesto(0, 2)} />);

    expect(screen.queryByRole("button", { name: /Reservado:/ })).not.toBeInTheDocument();
    expect(listarOrdenesComprometidas).not.toHaveBeenCalled();
  });

  it("si la consulta falla lo avisa dentro del modal", async () => {
    listarOrdenesComprometidas.mockRejectedValue(new Error("caída"));
    render(<PanelStock abrirIngreso={false} repuesto={repuesto(2, 0)} />);

    fireEvent.click(screen.getByRole("button", { name: /Reservado: 2/ }));

    expect(await screen.findByText("No se pudieron obtener las órdenes que tienen reservado este repuesto.")).toBeInTheDocument();
  });
});
