import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Estacionalidad } from "./estacionalidad";
import type { Estacionalidad as DatosEstacionalidad } from "@/tipos/estacionalidad";

const api = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/api/api-estacionalidad", () => ({ apiObtenerEstacionalidad: api }));
const filtros = { fechaDesde: "2025-01-01", fechaHasta: "2026-12-31", clienteId: "3", activoId: "", estado: "", tipo: "" };
const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, correctivas: i === 0 ? 3 : 0 }));
const datos: DatosEstacionalidad = { fechaDesde: filtros.fechaDesde, fechaHasta: filtros.fechaHasta, total: 3, meses,
  tipos: [{ tipoMaquinaId: 7, tipoMaquina: "Excavadora", total: 3, meses }] };
beforeEach(() => api.mockReset());

describe("A9: estacionalidad", () => {
  it("muestra los doce meses, intensidades, cifras, total y alternativa tabular", async () => {
    api.mockResolvedValue(datos);
    render(<Estacionalidad filtros={filtros} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    const tabla = await screen.findByRole("table");
    expect(within(tabla).getByRole("columnheader", { name: "Ene" })).toBeVisible();
    expect(within(tabla).getByRole("columnheader", { name: "Dic" })).toBeVisible();
    expect(within(tabla).getByTitle("Excavadora · Enero: 3 correctivas")).toHaveClass("estacionalidad-nivel-4");
    expect(within(tabla).getByTitle("Excavadora · Febrero: 0 correctivas")).toHaveClass("estacionalidad-nivel-0");
    expect(screen.getByRole("region", { name: /Mapa de calor mensual/ })).toHaveAttribute("tabindex", "0");
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(screen.getByRole("table")).not.toHaveClass("estacionalidad-mapa");
    fireEvent.click(screen.getByText("Cómo se calcula"));
    expect(screen.getByText(/Acumula el mismo mes de los distintos años/)).toBeVisible();
    expect(api).toHaveBeenCalledWith(filtros);
  });
  it("distingue vacío de error y permite reintentar", async () => {
    api.mockRejectedValueOnce(new Error("No se pudo obtener la estacionalidad."));
    api.mockResolvedValue({ ...datos, total: 0, tipos: [] });
    render(<Estacionalidad filtros={filtros} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo obtener");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("No hay correctivas en el período seleccionado.")).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("vuelve a consultar cuando cambian los filtros y escapa nombres del servidor", async () => {
    api.mockResolvedValue({ ...datos, tipos: [{ ...datos.tipos[0], tipoMaquina: "<script>prueba</script>" }] });
    const vista = render(<Estacionalidad filtros={filtros} />);
    expect((await screen.findAllByText("<script>prueba</script>"))[0]).toBeVisible();
    expect(vista.container.querySelector("script")).toBeNull();
    const nuevos = { ...filtros, activoId: "5" };
    vista.rerender(<Estacionalidad filtros={nuevos} />);
    await screen.findByRole("table");
    expect(api).toHaveBeenLastCalledWith(nuevos);
  });
});
