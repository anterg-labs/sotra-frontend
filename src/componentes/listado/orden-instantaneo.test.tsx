import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorNavegacionListado, useNavegacionListado } from "./navegacion-listado";
import { useFilasConOrdenInstantaneo } from "./orden-instantaneo";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push }) }));

type Fila = { id: number; nombre: string | null; veces: number };
const FILAS: Fila[] = [
  { id: 1, nombre: "Beta", veces: 2 },
  { id: 2, nombre: "Alfa", veces: 10 },
  { id: 3, nombre: null, veces: 1 },
  { id: 4, nombre: "Gamma", veces: 5 },
];
const VALORES = { nombre: (fila: Fila) => fila.nombre, veces: (fila: Fila) => fila.veces };

function Lista(props: { instantaneo: boolean; url: string }) {
  const { navegar } = useNavegacionListado();
  const filas = useFilasConOrdenInstantaneo(FILAS, VALORES, props.instantaneo);
  return (
    <>
      <button onClick={() => navegar(props.url)} type="button">ordenar</button>
      <ul>{filas.map((fila) => <li key={fila.id}>{fila.nombre ?? "sin nombre"}</li>)}</ul>
    </>
  );
}

const textos = () => screen.getAllByRole("listitem").map((item) => item.textContent);

function pintar(instantaneo: boolean, url: string) {
  return render(
    <ProveedorNavegacionListado etiquetaCarga="Cargando…">
      <Lista instantaneo={instantaneo} url={url} />
    </ProveedorNavegacionListado>,
  );
}

describe("orden al instante de un listado de una sola página", () => {
  let terminar: () => void = () => undefined;

  beforeEach(() => {
    push.mockReset();
    push.mockImplementation(() => new Promise<void>((resolver) => { terminar = resolver; }));
  });

  it("reordena las filas en el mismo clic, antes de que responda el servidor, y las deja al volver la respuesta", async () => {
    pintar(true, "/x?ordenarPor=nombre&direccionOrden=asc");
    expect(textos()).toEqual(["Beta", "Alfa", "sin nombre", "Gamma"]);

    fireEvent.click(screen.getByRole("button", { name: "ordenar" }));
    expect(textos()).toEqual(["Alfa", "Beta", "Gamma", "sin nombre"]);
    expect(push).toHaveBeenCalledWith("/x?ordenarPor=nombre&direccionOrden=asc");

    await act(async () => terminar());
    expect(textos()).toEqual(["Beta", "Alfa", "sin nombre", "Gamma"]);
  });

  it("respeta la dirección descendente, ordena números como números y deja los vacíos al final", () => {
    pintar(true, "/x?ordenarPor=veces&direccionOrden=desc");
    fireEvent.click(screen.getByRole("button", { name: "ordenar" }));
    expect(textos()).toEqual(["Alfa", "Gamma", "Beta", "sin nombre"]);
  });

  it("no reordena si hay más de una página: ahí el orden correcto lo decide el servidor", () => {
    pintar(false, "/x?ordenarPor=nombre&direccionOrden=asc");
    fireEvent.click(screen.getByRole("button", { name: "ordenar" }));
    expect(textos()).toEqual(["Beta", "Alfa", "sin nombre", "Gamma"]);
  });

  it("no reordena al quitar el orden ni con una columna desconocida", () => {
    pintar(true, "/x?ordenarPor=inexistente&direccionOrden=asc");
    fireEvent.click(screen.getByRole("button", { name: "ordenar" }));
    expect(textos()).toEqual(["Beta", "Alfa", "sin nombre", "Gamma"]);
  });
});
