import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraficoBarras, GraficoTendencia } from "./graficos";

describe("GraficoBarras", () => {
  it("muestra cada valor como texto y escala las barras al máximo", () => {
    const { container } = render(
      <GraficoBarras datos={[{ etiqueta: "Pausada", valor: 60, valorTexto: "2 d 12 h" }, { etiqueta: "En ejecución", valor: 30 }]} />,
    );

    expect(screen.getByText("2 d 12 h")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    const barras = [...container.querySelectorAll(".grafico-barras-pista > span")];
    expect(barras[0]).toHaveStyle({ width: "100%" });
    expect(barras[1]).toHaveStyle({ width: "50%" });
  });

  it("muestra el mensaje vacío si no hay datos", () => {
    render(<GraficoBarras datos={[]} vacio="Sin datos todavía." />);
    expect(screen.getByText("Sin datos todavía.")).toBeInTheDocument();
  });
});

describe("GraficoTendencia", () => {
  const puntos = [
    { periodo: "2026-10-05", preventivas: 1, correctivas: 3, total: 4 },
    { periodo: "2026-10-12", preventivas: 0, correctivas: 0, total: 0 },
  ];

  it("es una imagen con nombre y trae una tabla equivalente para lectores de pantalla", () => {
    render(<GraficoTendencia puntos={puntos} titulo="Órdenes por semana" />);

    expect(screen.getByRole("img", { name: "Órdenes por semana" })).toBeInTheDocument();
    const tabla = screen.getByRole("table", { name: "Órdenes por semana" });
    expect(within(tabla).getByText("2026-10-05")).toBeInTheDocument();
    expect(within(tabla).getAllByRole("row")).toHaveLength(3);
    expect(screen.getAllByText("Correctivas")).toHaveLength(2);
    expect(screen.getAllByText("Preventivas")).toHaveLength(2);
  });

  it("no falla con todo en cero ni sin períodos", () => {
    const { rerender } = render(<GraficoTendencia puntos={[{ periodo: "2026-10-05", preventivas: 0, correctivas: 0, total: 0 }]} titulo="Vacío" />);
    expect(screen.getByRole("img", { name: "Vacío" })).toBeInTheDocument();
    rerender(<GraficoTendencia puntos={[]} titulo="Vacío" />);
    expect(screen.getByText("No hay órdenes en el período.")).toBeInTheDocument();
  });
});
