import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnlaceVolver } from "./enlace-volver";

describe("EnlaceVolver", () => {
  it("es un enlace con la etiqueta como nombre accesible y como ayuda, y su flecha no se lee", () => {
    const { container } = render(<EnlaceVolver etiqueta="Volver al listado" href="/clientes" />);

    const enlace = screen.getByRole("link", { name: "Volver al listado" });
    expect(enlace).toHaveAttribute("href", "/clientes");
    expect(enlace).toHaveAttribute("title", "Volver al listado");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(enlace).not.toHaveTextContent("Volver");
  });
});
