"use client";

import { useNavegacionListadoOpcional } from "./navegacion-listado";
import { siguienteOrden, type OrdenListado } from "./url-listado";

type PropiedadesEncabezado = {
  columna: string;
  etiqueta: string;
  orden: Partial<OrdenListado> | undefined;
  /**
   * URL del listado con el orden nuevo; debe volver a la página 1 y conservar los filtros. Se pasa una función desde
   * componentes de cliente y, desde un Server Component (que no puede enviar funciones), la URL ya calculada con `urlSiguiente`.
   */
  construirUrl?: (orden: OrdenListado) => string;
  urlSiguiente?: string;
};

const NOMBRES_ORDEN = { asc: "ascendente", desc: "descendente" } as const;

/** Título de columna que ordena el listado al hacer clic (o con Enter o espacio) y anuncia el orden con `aria-sort`. */
export function EncabezadoOrdenable(props: PropiedadesEncabezado) {
  const { columna, etiqueta, orden, construirUrl, urlSiguiente } = props;
  const navegacion = useNavegacionListadoOpcional();
  const estaPendiente = navegacion?.estaPendiente ?? false;
  const actual: OrdenListado = navegacion?.ordenPendiente ?? { ordenarPor: orden?.ordenarPor ?? "", direccionOrden: orden?.direccionOrden ?? "" };
  const direccion = actual.ordenarPor === columna && actual.direccionOrden !== "" ? actual.direccionOrden : null;
  const siguiente = siguienteOrden(actual, columna);
  const accion =
    siguiente.ordenarPor === ""
      ? "quitar el orden"
      : "ordenar de forma " + NOMBRES_ORDEN[siguiente.direccionOrden as "asc" | "desc"];

  return (
    <th aria-sort={direccion === "asc" ? "ascending" : direccion === "desc" ? "descending" : "none"} scope="col">
      <button
        aria-label={etiqueta + ": " + accion}
        className="encabezado-ordenable"
        aria-disabled={estaPendiente || undefined}
        onClick={() => {
          if (!estaPendiente) navegacion?.navegar(urlSiguiente ?? construirUrl?.(siguiente) ?? "");
        }}
        type="button"
      >
        {etiqueta}
        <span aria-hidden="true" className="indicador-orden">{direccion === "asc" ? "▲" : direccion === "desc" ? "▼" : "↕"}</span>
      </button>
    </th>
  );
}
