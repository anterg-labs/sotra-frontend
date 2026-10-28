import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FiltroFecha, formatearFechaCorta, rangoDeFechasInvalido } from "./filtro-fecha";

function dibujar(fechaDesde = "", fechaHasta = "") {
  const alCambiar = vi.fn();
  render(<FiltroFecha alCambiar={alCambiar} etiqueta="Creada" fechaDesde={fechaDesde} fechaHasta={fechaHasta} id="creada" />);
  return alCambiar;
}

const abrir = () => fireEvent.click(screen.getByRole("button", { name: "Creada" }));

beforeEach(() => {
  vi.setSystemTime(new Date(2026, 9, 27, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FiltroFecha", () => {
  it("solo rechaza rangos completos invertidos", () => {
    expect(rangoDeFechasInvalido("2026-10-15", "2026-10-01")).toBe(true);
    expect(rangoDeFechasInvalido("2026-10-01", "2026-10-15")).toBe(false);
    expect(rangoDeFechasInvalido("2026-10-01", "2026-10-01")).toBe(false);
    expect(rangoDeFechasInvalido("2026-10-01", "")).toBe(false);
  });

  it("da formato a las fechas", () => {
    expect(formatearFechaCorta("2026-10-05")).toBe("05/10/2026");
  });

  it("muestra «Cualquier fecha», un día o un rango en un solo botón", () => {
    const { unmount } = render(<FiltroFecha alCambiar={vi.fn()} etiqueta="Creada" fechaDesde="" fechaHasta="" id="a" />);
    expect(screen.getByText("Cualquier fecha")).toBeInTheDocument();
    unmount();
    const dia = render(<FiltroFecha alCambiar={vi.fn()} etiqueta="Creada" fechaDesde="2026-10-12" fechaHasta="2026-10-12" id="b" />);
    expect(screen.getByText("12/10/2026")).toBeInTheDocument();
    dia.unmount();
    render(<FiltroFecha alCambiar={vi.fn()} etiqueta="Creada" fechaDesde="2026-10-01" fechaHasta="2026-10-15" id="c" />);
    expect(screen.getByText("01/10/2026 – 15/10/2026")).toBeInTheDocument();
  });

  it("un clic elige un día fijo y se envía como desde y hasta iguales", () => {
    const alCambiar = dibujar();
    abrir();
    expect(screen.getByRole("dialog", { name: "Elegir creada" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "12 de octubre de 2026" }));

    expect(alCambiar).toHaveBeenCalledWith("2026-10-12", "2026-10-12");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("un segundo clic arma el rango, aunque se elija un día anterior, y cierra el panel", () => {
    const alCambiar = dibujar();
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "20 de octubre de 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "8 de octubre de 2026" }));

    expect(alCambiar).toHaveBeenLastCalledWith("2026-10-08", "2026-10-20");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("muestra dos meses, navega y marca el rango elegido", () => {
    dibujar("2026-10-10", "2026-10-12");
    abrir();
    expect(screen.getByText("octubre de 2026")).toBeInTheDocument();
    expect(screen.getByText("noviembre de 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "11 de octubre de 2026" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "13 de octubre de 2026" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(screen.getByText("diciembre de 2026")).toBeInTheDocument();
  });

  it("los atajos aplican un rango y «Cualquier fecha» lo limpia", () => {
    const alCambiar = dibujar();
    abrir();
    fireEvent.click(within(screen.getByRole("list", { name: "Atajos" })).getByRole("button", { name: "Últimos 7 días" }));
    expect(alCambiar).toHaveBeenLastCalledWith("2026-10-21", "2026-10-27");
    expect(screen.queryByRole("dialog")).toBeNull();

    abrir();
    fireEvent.click(within(screen.getByRole("list", { name: "Atajos" })).getByRole("button", { name: "Mes pasado" }));
    expect(alCambiar).toHaveBeenLastCalledWith("2026-09-01", "2026-09-30");

    abrir();
    fireEvent.click(within(screen.getByRole("list", { name: "Atajos" })).getByRole("button", { name: "Cualquier fecha" }));
    expect(alCambiar).toHaveBeenLastCalledWith("", "");
  });

  it("la cruz quita el filtro y Escape cierra el panel", () => {
    const alCambiar = dibujar("2026-10-01", "2026-10-15");
    fireEvent.click(screen.getByRole("button", { name: "Quitar el filtro de creada" }));
    expect(alCambiar).toHaveBeenCalledWith("", "");

    abrir();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("un clic afuera cierra el panel", () => {
    dibujar();
    abrir();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
