import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContenedorGrafico } from "./graficos-avanzados";
import { ProveedorVisibilidadReportes } from "./visibilidad-reportes";
import { CATALOGO_REPORTES, codigoDeGrafico } from "@/servicios/catalogo-elementos-reportes";

describe("visibilidad individual de Reportes", () => {
  it("oculta solo la gráfica desactivada y conserva la otra", () => {
    render(<ProveedorVisibilidadReportes desactivados={[codigoDeGrafico("Consumo de repuestos en unidades")]}>
      <ContenedorGrafico titulo="Consumo de repuestos en unidades" grafico={<p>Diez unidades</p>} tabla={<p>Tabla</p>} />
      <ContenedorGrafico titulo="Resumen por cliente" grafico={<p>Clientes</p>} tabla={<p>Tabla</p>} />
    </ProveedorVisibilidadReportes>);
    expect(screen.queryByRole("region", { name: "Consumo de repuestos en unidades" })).not.toBeInTheDocument();
    expect(screen.getByText("Clientes")).toBeVisible();
  });
  it("registra un código distinto por control del catálogo", () => {
    expect(new Set(CATALOGO_REPORTES.map(item => item.codigo)).size).toBe(CATALOGO_REPORTES.length);
  });
});
