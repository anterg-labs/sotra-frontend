"use client";

import { useMemo, useState } from "react";

export type DireccionLocal = "asc" | "desc";
export type OrdenLocal<C extends string> = { columna: C; direccion: DireccionLocal } | null;
export type ValorOrdenable = string | number | boolean | null;

const NOMBRES_ORDEN = { asc: "ascendente", desc: "descendente" } as const;
const COMPARADOR_TEXTO = new Intl.Collator("es-UY", { numeric: true, sensitivity: "accent" });

function comparar(a: ValorOrdenable, b: ValorOrdenable) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return COMPARADOR_TEXTO.compare(String(a), String(b));
}

/** Sin orden → ascendente → descendente → sin orden, igual que los listados paginados. */
export function siguienteOrdenLocal<C extends string>(actual: OrdenLocal<C>, columna: C): OrdenLocal<C> {
  if (actual?.columna !== columna) return { columna, direccion: "asc" };
  return actual.direccion === "asc" ? { columna, direccion: "desc" } : null;
}

/** Copia de `filas` ordenada por `obtener`; los valores vacíos van siempre al final, sea cual sea la dirección. */
export function ordenarFilas<T>(filas: readonly T[], obtener: (fila: T) => ValorOrdenable, direccion: DireccionLocal): T[] {
  const signo = direccion === "asc" ? 1 : -1;
  return [...filas].sort((x, y) => {
    const a = obtener(x);
    const b = obtener(y);
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return signo * comparar(a, b);
  });
}

/**
 * Orden en el navegador para tablas pequeñas que ya tienen todas sus filas (resúmenes, historiales cortos).
 * Los listados con paginación ordenan en el servidor con `EncabezadoOrdenable`. Los valores vacíos van siempre al final.
 */
export function useOrdenLocal<T, C extends string>(filas: readonly T[], valores: Record<C, (fila: T) => ValorOrdenable>) {
  const [orden, setOrden] = useState<OrdenLocal<C>>(null);

  const filasOrdenadas = useMemo(() => {
    if (!orden) return filas;
    return ordenarFilas(filas, valores[orden.columna], orden.direccion);
    // `valores` se declara fuera del componente o con useMemo en quien llama; depender de él no aporta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, orden]);

  return { filasOrdenadas, orden, alternar: (columna: C) => setOrden((actual) => siguienteOrdenLocal(actual, columna)) };
}

/** Título de columna que ordena la tabla en el navegador al hacer clic (o con Enter o espacio) y anuncia el orden con `aria-sort`. */
export function EncabezadoOrdenLocal<C extends string>(props: {
  columna: C;
  etiqueta: string;
  orden: OrdenLocal<C>;
  alternar: (columna: C) => void;
}) {
  const { columna, etiqueta, orden, alternar } = props;
  const direccion = orden?.columna === columna ? orden.direccion : null;
  const siguiente = siguienteOrdenLocal(orden, columna);
  const accion = siguiente ? "ordenar de forma " + NOMBRES_ORDEN[siguiente.direccion] : "quitar el orden";

  return (
    <th aria-sort={direccion === "asc" ? "ascending" : direccion === "desc" ? "descending" : "none"} scope="col">
      <button aria-label={etiqueta + ": " + accion} className="encabezado-ordenable" onClick={() => alternar(columna)} type="button">
        {etiqueta}
        <span aria-hidden="true" className="indicador-orden">{direccion === "asc" ? "▲" : direccion === "desc" ? "▼" : "↕"}</span>
      </button>
    </th>
  );
}
