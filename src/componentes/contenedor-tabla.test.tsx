import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContenedorTabla } from "./contenedor-tabla";

describe("ContenedorTabla", () => {
  it("es una región con nombre, enfocable con el teclado, que contiene la tabla", () => {
    render(
      <ContenedorTabla etiqueta="Listado de prueba">
        <table><tbody><tr><td>dato</td></tr></tbody></table>
      </ContenedorTabla>,
    );
    const region = screen.getByRole("region", { name: "Listado de prueba" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveClass("table-container");
    expect(region).toContainElement(screen.getByRole("table"));
  });
});
