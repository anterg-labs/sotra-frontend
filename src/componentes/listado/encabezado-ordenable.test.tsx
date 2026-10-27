import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncabezadoOrdenable } from "./encabezado-ordenable";
import { ProveedorNavegacionListado } from "./navegacion-listado";
import { urlConOrden } from "./url-listado-prueba";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push }) }));

function tabla(orden: { ordenarPor: string; direccionOrden: "asc" | "desc" | "" }) {
  return (
    <ProveedorNavegacionListado etiquetaCarga="Cargando…">
      <table>
        <thead>
          <tr>
            <EncabezadoOrdenable columna="nombre" etiqueta="Nombre" orden={orden} urlSiguiente={urlConOrden("nombre", "asc")} />
            <EncabezadoOrdenable columna="estado" etiqueta="Estado" orden={orden} urlSiguiente={urlConOrden("estado", "asc")} />
          </tr>
        </thead>
      </table>
    </ProveedorNavegacionListado>
  );
}

describe("título de columna ordenable", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("mientras llega la página nueva muestra enseguida el orden pedido y no bloquea el botón (conserva el foco)", async () => {
    let terminar: () => void = () => undefined;
    push.mockImplementation(() => new Promise<void>((resolver) => { terminar = resolver; }));
    render(tabla({ ordenarPor: "", direccionOrden: "" }));

    const nombre = screen.getByRole("button", { name: "Nombre: ordenar de forma ascendente" });
    nombre.focus();
    fireEvent.click(nombre);

    expect(push).toHaveBeenCalledWith("/x?ordenarPor=nombre&direccionOrden=asc");
    expect(await screen.findByRole("columnheader", { name: /Nombre/ })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("button", { name: "Nombre: ordenar de forma descendente" })).toHaveFocus();
    expect(screen.getByRole("button", { name: /Estado/ })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Estado/ }));
    expect(push).toHaveBeenCalledTimes(1);
    await act(async () => terminar());
  });
});
