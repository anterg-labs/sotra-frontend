import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarraNivelStock, InsigniaStock } from "./indicador-stock";

describe("InsigniaStock", () => {
  it.each([
    ["normal", "Stock normal"],
    ["bajo", "Stock bajo"],
    ["sin_stock", "Sin stock"],
  ] as const)("muestra el texto %s además del color", (estadoStock, texto) => {
    render(<InsigniaStock estadoStock={estadoStock} />);
    expect(screen.getByText(texto)).toBeInTheDocument();
  });
});

describe("BarraNivelStock", () => {
  it("expone el nivel a las tecnologías de apoyo y no supera el 100 %", () => {
    render(<BarraNivelStock cantidad={50} cantidadMinima={5} estadoStock="normal" />);
    const medidor = screen.getByRole("meter", { name: "Nivel de stock: 50 de un mínimo de 5" });
    expect(medidor).toHaveAttribute("aria-valuenow", "10");
    expect(medidor.firstElementChild).toHaveStyle({ width: "100%" });
  });

  it("no divide por cero con mínimo 0", () => {
    render(<BarraNivelStock cantidad={0} cantidadMinima={0} estadoStock="sin_stock" />);
    expect(screen.getByRole("meter").firstElementChild).toHaveStyle({ width: "0%" });
  });
});
