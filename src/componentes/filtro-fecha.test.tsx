import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FiltroFecha } from "./filtro-fecha";

function dibujar(fechaDesde = "", fechaHasta = "") {
  const alCambiar = vi.fn();
  render(
    <FiltroFecha
      alCambiar={alCambiar}
      etiqueta="Creada"
      fechaDesde={fechaDesde}
      fechaHasta={fechaHasta}
      id="creada"
    />,
  );
  return alCambiar;
}

describe("FiltroFecha", () => {
  it("muestra un solo selector y envía desde y hasta iguales para un día fijo", () => {
    const alCambiar = dibujar();

    fireEvent.change(screen.getByLabelText("Creada"), { target: { value: "2026-10-12" } });

    expect(screen.queryByLabelText("Creada hasta")).toBeNull();
    expect(alCambiar).toHaveBeenCalledWith("2026-10-12", "2026-10-12");
  });

  it("muestra el segundo selector al marcar la casilla de rango", () => {
    dibujar("2026-10-01", "2026-10-01");

    fireEvent.click(screen.getByLabelText("Rango de fechas"));

    expect(screen.getByLabelText("Creada desde")).toBeDefined();
    expect(screen.getByLabelText("Creada hasta")).toBeDefined();
  });

  it("empieza en modo rango cuando las fechas ya son distintas", () => {
    dibujar("2026-10-01", "2026-10-15");

    expect(screen.getByLabelText("Creada hasta")).toBeDefined();
  });

  it("avisa cuando el fin es anterior al inicio", () => {
    dibujar("2026-10-15", "2026-10-01");

    expect(screen.getByRole("alert").textContent).toBe("La fecha final no puede ser anterior a la inicial.");
  });

  it("al volver a un día fijo conserva solo la fecha inicial", () => {
    const alCambiar = dibujar("2026-10-01", "2026-10-15");

    fireEvent.click(screen.getByLabelText("Rango de fechas"));

    expect(alCambiar).toHaveBeenCalledWith("2026-10-01", "2026-10-01");
  });
});
