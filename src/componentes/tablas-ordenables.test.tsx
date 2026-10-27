import { fireEvent, render, renderHook, act, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { siguienteOrdenLocal, useOrdenLocal } from "@/componentes/listado/orden-local";
import { TablaCantidadesPorGrupo, TablaMovimientosRepuesto, TablaOrdenesResumen, TablaRepuestosBajoStock } from "@/componentes/tablas-ordenables";
import type { MovimientoStock } from "@/tipos/movimiento-stock";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Repuesto } from "@/tipos/repuesto";

function orden(id: number, cliente: string, prioridad: OrdenTrabajo["prioridad"], tecnico: string | null): OrdenTrabajo {
  return {
    id, clienteId: id, nombreCliente: cliente, activoId: id, nombreActivo: "Activo " + id, tecnicoId: tecnico ? id : null,
    nombreTecnico: tecnico, tipo: "correctivo", prioridad, descripcion: "", observaciones: "", fechaPrevistaEjecucion: "2026-10-30",
    estado: "creada", creadoEn: "2026-10-20T10:00:00Z", fechaInicio: null, fechaCierre: null, sugerencias: [], repuestos: [],
    transiciones: [], historialEstados: [], version: "v",
  };
}

/** Texto de la primera columna de cada fila de datos. */
function primeraColumna() {
  return screen.getAllByRole("row").slice(1).map((fila) => within(fila).getAllByRole("cell")[0].textContent);
}

describe("orden local", () => {
  it("recorre ascendente → descendente → sin orden y cambia de columna desde ascendente", () => {
    expect(siguienteOrdenLocal(null, "a")).toEqual({ columna: "a", direccion: "asc" });
    expect(siguienteOrdenLocal({ columna: "a", direccion: "asc" }, "a")).toEqual({ columna: "a", direccion: "desc" });
    expect(siguienteOrdenLocal({ columna: "a", direccion: "desc" }, "a")).toBeNull();
    expect(siguienteOrdenLocal({ columna: "a", direccion: "desc" }, "b")).toEqual({ columna: "b", direccion: "asc" });
  });

  it("ordena números como números, textos con acentos y números dentro del texto, y deja los vacíos al final", () => {
    const filas = [
      { n: 10, t: "Árbol 10", v: null as number | null },
      { n: 2, t: "arbol 2", v: 5 },
      { n: 33, t: "Zorro", v: 1 },
    ];
    const valores = { n: (f: (typeof filas)[number]) => f.n, t: (f: (typeof filas)[number]) => f.t, v: (f: (typeof filas)[number]) => f.v };
    const { result } = renderHook(() => useOrdenLocal(filas, valores));

    expect(result.current.filasOrdenadas.map((f) => f.n)).toEqual([10, 2, 33]);
    act(() => result.current.alternar("n"));
    expect(result.current.filasOrdenadas.map((f) => f.n)).toEqual([2, 10, 33]);
    act(() => result.current.alternar("n"));
    expect(result.current.filasOrdenadas.map((f) => f.n)).toEqual([33, 10, 2]);
    act(() => result.current.alternar("n"));
    expect(result.current.filasOrdenadas.map((f) => f.n)).toEqual([10, 2, 33]);

    act(() => result.current.alternar("t"));
    expect(result.current.filasOrdenadas.map((f) => f.t)).toEqual(["arbol 2", "Árbol 10", "Zorro"]);
    act(() => result.current.alternar("v"));
    expect(result.current.filasOrdenadas.map((f) => f.v)).toEqual([1, 5, null]);
    act(() => result.current.alternar("v"));
    expect(result.current.filasOrdenadas.map((f) => f.v)).toEqual([5, 1, null]);
  });
});

describe("tablas ordenables en el navegador", () => {
  const ordenes = [orden(3, "Cementos Sur", "media", "Ana Gómez"), orden(1, "Aceros Norte", "alta", null), orden(2, "Bobinas SA", "baja", "Luis Pérez")];

  it("«Órdenes recientes» ordena al hacer clic en cada título, anuncia el orden y vuelve al original", () => {
    render(<TablaOrdenesResumen etiqueta="Órdenes recientes" ordenes={ordenes} />);
    expect(primeraColumna()).toEqual(["3", "1", "2"]);

    const cliente = screen.getByRole("button", { name: "Cliente: ordenar de forma ascendente" });
    fireEvent.click(cliente);
    expect(primeraColumna()).toEqual(["1", "2", "3"]);
    expect(screen.getByRole("columnheader", { name: /Cliente/ })).toHaveAttribute("aria-sort", "ascending");

    fireEvent.click(screen.getByRole("button", { name: "Cliente: ordenar de forma descendente" }));
    expect(primeraColumna()).toEqual(["3", "2", "1"]);
    expect(screen.getByRole("columnheader", { name: /Cliente/ })).toHaveAttribute("aria-sort", "descending");

    fireEvent.click(screen.getByRole("button", { name: "Cliente: quitar el orden" }));
    expect(primeraColumna()).toEqual(["3", "1", "2"]);
    expect(screen.getByRole("columnheader", { name: /Cliente/ })).toHaveAttribute("aria-sort", "none");
  });

  it("ordena la prioridad de menor a mayor gravedad y deja «Sin asignar» al final al ordenar por técnico", () => {
    render(<TablaOrdenesResumen etiqueta="Órdenes recientes" ordenes={ordenes} />);
    fireEvent.click(screen.getByRole("button", { name: /^Prioridad/ }));
    expect(primeraColumna()).toEqual(["2", "3", "1"]);

    fireEvent.click(screen.getByRole("button", { name: /^Técnico/ }));
    expect(primeraColumna()).toEqual(["3", "2", "1"]);
    fireEvent.click(screen.getByRole("button", { name: /^Técnico/ }));
    expect(primeraColumna()).toEqual(["2", "3", "1"]);
  });

  it("la columna de acciones no es ordenable", () => {
    render(<TablaOrdenesResumen etiqueta="Órdenes recientes" ordenes={ordenes} />);
    expect(screen.getByRole("columnheader", { name: "Acciones" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Acciones/ })).not.toBeInTheDocument();
  });

  it("las cantidades por grupo ordenan por nombre y por cantidad", () => {
    render(<TablaCantidadesPorGrupo columna="Estado" grupos={[{ nombre: "Creada", cantidad: 4 }, { nombre: "Cerrada", cantidad: 9 }, { nombre: "Asignada", cantidad: 1 }]} titulo="Órdenes por estado" />);
    expect(primeraColumna()).toEqual(["Creada", "Cerrada", "Asignada"]);
    fireEvent.click(screen.getByRole("button", { name: /^Cantidad/ }));
    expect(primeraColumna()).toEqual(["Asignada", "Creada", "Cerrada"]);
    fireEvent.click(screen.getByRole("button", { name: /^Estado/ }));
    expect(primeraColumna()).toEqual(["Asignada", "Cerrada", "Creada"]);
  });

  it("los repuestos con bajo stock ordenan por cantidad y por estado de stock", () => {
    const repuesto = (id: number, codigo: string, cantidad: number, estadoStock: Repuesto["estadoStock"]): Repuesto => ({
      id, codigo, nombre: "Repuesto " + codigo, descripcion: "", marca: "", ubicacion: "", cantidad, cantidadMinima: 5, estado: "activo", estadoStock,
    });
    render(<TablaRepuestosBajoStock repuestos={[repuesto(1, "B-1", 3, "bajo"), repuesto(2, "A-1", 0, "sin_stock"), repuesto(3, "C-1", 4, "bajo")]} />);
    fireEvent.click(screen.getByRole("button", { name: /^Cantidad/ }));
    expect(primeraColumna()).toEqual(["A-1", "B-1", "C-1"]);
    fireEvent.click(screen.getByRole("button", { name: /^Código/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Código/ }));
    expect(primeraColumna()).toEqual(["C-1", "B-1", "A-1"]);
  });

  it("los movimientos del repuesto ordenan por fecha real (no por texto) y por cantidad", () => {
    const movimiento = (id: number, fecha: string, cantidad: number, nombreUsuario: string | null): MovimientoStock => ({
      id, repuestoId: 1, codigoRepuesto: "R-1", nombreRepuesto: "Filtro", tipo: "ingreso", cantidad, fecha, ubicacion: "A-1",
      usuarioId: null, nombreUsuario, motivo: "Compra", observaciones: "", stockAnterior: 0, stockPosterior: cantidad,
    });
    render(
      <TablaMovimientosRepuesto
        movimientos={[movimiento(1, "2026-10-21T12:00:00Z", 7, "Ana"), movimiento(2, "2026-09-30T08:00:00Z", 2, null), movimiento(3, "2026-10-05T09:00:00Z", 5, "Beto")]}
      />,
    );
    const ids = () => screen.getAllByRole("link", { name: "Ver detalle" }).map((enlace) => enlace.getAttribute("href")?.split("/").pop());
    expect(ids()).toEqual(["1", "2", "3"]);
    fireEvent.click(screen.getByRole("button", { name: /^Fecha y hora/ }));
    expect(ids()).toEqual(["2", "3", "1"]);
    fireEvent.click(screen.getByRole("button", { name: /^Cantidad/ }));
    expect(ids()).toEqual(["2", "3", "1"]);
    fireEvent.click(screen.getByRole("button", { name: /^Usuario/ }));
    expect(ids()).toEqual(["1", "3", "2"]);
  });
});
