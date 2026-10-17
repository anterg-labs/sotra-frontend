import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaginaOrdenDelTecnico from "./page";

const obtenerOrdenTrabajoServidor = vi.hoisted(() => vi.fn());
const cambiarEstadoOrdenTrabajo = vi.hoisted(() => vi.fn());

vi.mock("@/componentes/evidencias-orden-trabajo", () => ({ EvidenciasOrdenTrabajo: () => <p>Evidencias de la orden</p> }));
vi.mock("@/servicios/servidor/ordenes-trabajo", () => ({ obtenerOrdenTrabajoServidor }));
vi.mock("@/servicios/servicio-ordenes-trabajo", async (importarOriginal) => ({
  ...await importarOriginal<typeof import("@/servicios/servicio-ordenes-trabajo")>(),
  cambiarEstadoOrdenTrabajo,
}));

function orden(estado: string, estadosSiguientes: string[]) {
  return {
    id: 6, clienteId: 1, nombreCliente: "ANTER-G", activoId: 2, nombreActivo: "Retroexcavadora", tecnicoId: 25,
    nombreTecnico: "Roberto Pérez", tipo: "correctivo", prioridad: "alta", descripcion: "Cambiar el filtro",
    observaciones: "", fechaPrevistaEjecucion: "2026-12-02", estado, creadoEn: "2026-10-08T12:00:00Z",
    fechaInicio: null, fechaCierre: null, sugerencias: [], repuestos: [], estadosSiguientes,
    historialEstados: [{ estado: "creada", fechaHora: "2026-10-08T12:00:00Z", observacion: null }],
  };
}

const parametros = { params: Promise.resolve({ id: "6" }) };

describe("orden del técnico", () => {
  beforeEach(() => {
    obtenerOrdenTrabajoServidor.mockReset();
    cambiarEstadoOrdenTrabajo.mockReset();
  });

  it("solo ofrece las acciones de un técnico: nunca cancelar ni cerrar", async () => {
    obtenerOrdenTrabajoServidor.mockResolvedValue(orden("finalizada", ["cerrada", "asignada"]));
    render(await PaginaOrdenDelTecnico(parametros));

    expect(screen.getByText("Cambiar el filtro")).toBeInTheDocument();
    expect(obtenerOrdenTrabajoServidor).toHaveBeenCalledWith(6);
    expect(screen.queryByRole("group", { name: "Acciones de la orden" })).not.toBeInTheDocument();
  });

  it("en ejecución ofrece pausar y finalizar", async () => {
    obtenerOrdenTrabajoServidor.mockResolvedValue(orden("en_ejecucion", ["pausada", "finalizada"]));
    render(await PaginaOrdenDelTecnico(parametros));

    const acciones = screen.getByRole("group", { name: "Acciones de la orden" });
    expect(acciones).toHaveTextContent("Pausar");
    expect(acciones).toHaveTextContent("Finalizar");
    expect(screen.queryByRole("button", { name: /Cancelar orden|Cerrar/ })).not.toBeInTheDocument();
  });

  it("pausar exige un motivo, lo muestra junto al campo con foco y no llama a la API", async () => {
    obtenerOrdenTrabajoServidor.mockResolvedValue(orden("en_ejecucion", ["pausada", "finalizada"]));
    render(await PaginaOrdenDelTecnico(parametros));

    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pausa" }));

    expect(await screen.findByText("Indicá por qué pausás la orden.")).toHaveAttribute("id", "motivoPausa-error");
    expect(screen.getByLabelText("Motivo de la pausa")).toHaveFocus();
    expect(cambiarEstadoOrdenTrabajo).not.toHaveBeenCalled();
  });

  it("pausar con motivo cambia el estado y avisa", async () => {
    obtenerOrdenTrabajoServidor.mockResolvedValue(orden("en_ejecucion", ["pausada", "finalizada"]));
    cambiarEstadoOrdenTrabajo.mockResolvedValue(orden("pausada", ["en_ejecucion", "cancelada"]));
    render(await PaginaOrdenDelTecnico(parametros));

    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    fireEvent.change(screen.getByLabelText("Motivo de la pausa"), { target: { value: "Falta de material" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar pausa" }));

    await waitFor(() => expect(cambiarEstadoOrdenTrabajo).toHaveBeenCalledWith(6, "en_ejecucion", "pausada", "Falta de material"));
    expect(await screen.findByText("Estado actualizado: Pausada.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reanudar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("muestra un error claro si no se puede cargar la orden o el id es inválido", async () => {
    obtenerOrdenTrabajoServidor.mockRejectedValue(new Error("red"));
    const { unmount } = render(await PaginaOrdenDelTecnico(parametros));
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo obtener la orden");
    unmount();

    obtenerOrdenTrabajoServidor.mockClear();
    render(await PaginaOrdenDelTecnico({ params: Promise.resolve({ id: "abc" }) }));
    expect(obtenerOrdenTrabajoServidor).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo obtener la orden");
  });
});
