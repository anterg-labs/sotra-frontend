import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PanelVisibilidadReportes } from "./panel-visibilidad-reportes";

const actualizar = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/api/api-visibilidad-reportes", () => ({ apiActualizarVisibilidadReporte: actualizar }));
beforeEach(() => { actualizar.mockReset(); });

describe("configuración individual de Reportes", () => {
  it("desactiva un indicador sin alterar otro y refleja el estado guardado", async () => {
    actualizar.mockResolvedValue({ codigo: "resumen_ordenes_registradas", visible: false });
    render(<PanelVisibilidadReportes inicial={[{ codigo: "resumen_tiempo_inicio", visible: false }]} />);
    const ordenes = screen.getByRole("switch", { name: "Órdenes de trabajo registradas" });
    const inicio = screen.getByRole("switch", { name: "Tiempo promedio hasta el inicio" });
    expect(ordenes).toBeChecked();
    expect(inicio).not.toBeChecked();
    fireEvent.click(ordenes);
    await waitFor(() => expect(actualizar).toHaveBeenCalledWith("resumen_ordenes_registradas", false));
    expect(ordenes).not.toBeChecked();
    expect(inicio).not.toBeChecked();
  });
  it("permite guardar otra opción mientras la primera está pendiente", async () => {
    const resolver: Array<(valor: unknown) => void> = [];
    actualizar.mockImplementation(() => new Promise(resolve => resolver.push(resolve)));
    render(<PanelVisibilidadReportes inicial={[]} />);
    const ordenes = screen.getByRole("switch", { name: "Órdenes de trabajo registradas" });
    const inicio = screen.getByRole("switch", { name: "Tiempo promedio hasta el inicio" });
    fireEvent.click(ordenes);
    expect(ordenes).toBeDisabled();
    expect(inicio).toBeEnabled();
    fireEvent.click(inicio);
    await waitFor(() => expect(actualizar).toHaveBeenCalledTimes(2));
    expect(actualizar).toHaveBeenCalledWith("resumen_ordenes_registradas", false);
    expect(actualizar).toHaveBeenCalledWith("resumen_tiempo_inicio", false);
    resolver.forEach(resolverCambio => resolverCambio({ visible: false }));
    await waitFor(() => expect(ordenes).toBeEnabled());
    await waitFor(() => expect(inicio).toBeEnabled());
  });
  it("mantiene el estado anterior si falla el guardado", async () => {
    actualizar.mockRejectedValue(new Error("No se pudo guardar el cambio."));
    render(<PanelVisibilidadReportes inicial={[]} />);
    const ordenes = screen.getByRole("switch", { name: "Órdenes de trabajo registradas" });
    fireEvent.click(ordenes);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar el cambio."));
    expect(ordenes).toBeChecked();
    expect(ordenes).toBeEnabled();
  });
});
