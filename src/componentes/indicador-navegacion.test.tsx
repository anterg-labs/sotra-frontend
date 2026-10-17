import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndicadorNavegacion } from "./indicador-navegacion";

const estado = vi.hoisted(() => ({ pending: false }));
vi.mock("next/link", () => ({ useLinkStatus: () => estado }));
afterEach(() => { cleanup(); estado.pending = false; });

describe("IndicadorNavegacion", () => {
  it("no anuncia una carga inexistente", () => {
    render(<IndicadorNavegacion destino="Clientes" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("muestra el destino pendiente fuera del menú y desaparece al completar o cancelar la navegación", () => {
    const { container, rerender } = render(<IndicadorNavegacion destino="Clientes" />);
    estado.pending = true;
    rerender(<IndicadorNavegacion destino="Clientes" />);
    expect(screen.getByRole("status")).toHaveTextContent("Abriendo Clientes…");
    expect(container).toBeEmptyDOMElement();
    estado.pending = false;
    rerender(<IndicadorNavegacion destino="Clientes" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
