import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesgasteEdadUso } from "./desgaste-edad-uso";
import { ProveedorVisibilidadReportes } from "@/componentes/visibilidad-reportes";
import { codigoDeGrafico } from "@/servicios/catalogo-elementos-reportes";

const obtener = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/api/api-desgaste-edad-uso", () => ({ apiObtenerDesgasteEdadUso: obtener }));
beforeEach(() => { obtener.mockReset(); });
const filtros = { fechaDesde: "", fechaHasta: "", clienteId: "", activoId: "", estado: "", tipo: "" };
const base = {
  fechaDesde: null, fechaHasta: null, totalActivos: 2, conEdad: 2, conUso: 2,
  activos: [
    { activoId: 1, nombreActivo: "Retro 1", modelo: "M", edadAnios: 5,
      lecturaUso: 100, unidadUso: "horas", fechaLectura: "2026-10-27T00:00:00Z",
      correctivas: 2, ordenesObservadas: 3 },
    { activoId: 2, nombreActivo: "Retro 2", modelo: "M", edadAnios: 5,
      lecturaUso: 1000, unidadUso: "kilometros", fechaLectura: "2026-10-27T00:00:00Z",
      correctivas: 1, ordenesObservadas: 2 },
  ],
};

describe("desgaste por edad y uso", () => {
  it("separa unidades, muestra los puntos y ofrece tabla con enlaces", async () => {
    obtener.mockResolvedValue(base);
    render(<DesgasteEdadUso filtros={filtros} />);
    expect(await screen.findByRole("img", { name: "Correctivas frente a edad de la máquina" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Correctivas frente a horas de uso" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Correctivas frente a kilómetros de uso" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Ver como tabla" })[1]);
    const enlaces = screen.getAllByRole("link", { name: "Retro 1" });
    expect(enlaces[0]).toHaveAttribute("href", "/activos/1");
    expect(screen.queryByRole("link", { name: "Retro 2" })).not.toBeInTheDocument();
  });
  it("oculta una gráfica configurada sin quitar las otras", async () => {
    obtener.mockResolvedValue(base);
    render(<ProveedorVisibilidadReportes desactivados={[codigoDeGrafico("Correctivas frente a horas de uso")]}>
      <DesgasteEdadUso filtros={filtros} />
    </ProveedorVisibilidadReportes>);
    await waitFor(() => expect(screen.getByRole("img", { name: "Correctivas frente a edad de la máquina" })).toBeInTheDocument());
    expect(screen.queryByRole("img", { name: "Correctivas frente a horas de uso" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Correctivas frente a kilómetros de uso" })).toBeInTheDocument();
  });
  it("informa falta de datos y permite reintentar un error", async () => {
    obtener.mockRejectedValueOnce(new Error("No se pudo obtener el análisis.")).mockResolvedValueOnce({
      fechaDesde: null, fechaHasta: null, totalActivos: 0, conEdad: 0, conUso: 0, activos: [],
    });
    render(<DesgasteEdadUso filtros={filtros} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo obtener");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect((await screen.findAllByText("No hay activos con este dato en el período.")).length).toBeGreaterThanOrEqual(3);
  });
});
