import {
  construirUrlListado,
  leerEstado,
  leerOrden,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosRepuestos } from "@/tipos/repuesto";

export const RUTA_REPUESTOS = "/repuestos";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_REPUESTOS = ["codigo", "nombre", "marca", "ubicacion", "cantidad", "cantidadMinima", "cantidadReservada", "cantidadEntregada", "cantidadDisponible", "estado"] as const;

export type FiltroStock = "" | "alerta" | "bajo" | "sin_stock";

/** Filtros tal como viajan en la URL; `stock` agrupa `bajoStock` y `estadoStock` de la API. */
export type FiltrosUrlRepuestos = {
  buscar: string;
  estado: string;
  ubicacion: string;
  stock: FiltroStock;
  pagina: number;
  ordenarPor?: string;
  direccionOrden?: "asc" | "desc" | "";
};

export function leerFiltrosRepuestos(parametros: ParametrosBusqueda): FiltrosUrlRepuestos {
  const stock = primerValor(parametros.stock);
  return {
    buscar: primerValor(parametros.buscar),
    estado: leerEstado(parametros),
    ubicacion: primerValor(parametros.ubicacion),
    stock: stock === "alerta" || stock === "bajo" || stock === "sin_stock" ? stock : "",
    pagina: leerPagina(parametros),
    ...leerOrden(parametros, COLUMNAS_ORDENABLES_REPUESTOS),
  };
}

export function construirUrlRepuestos(filtros: FiltrosUrlRepuestos) {
  return construirUrlListado(RUTA_REPUESTOS, filtros);
}

/** Traduce el filtro de la URL a los parámetros de la API. */
export function aFiltrosApiRepuestos(filtros: FiltrosUrlRepuestos): FiltrosRepuestos {
  return {
    buscar: filtros.buscar,
    estado: filtros.estado,
    ubicacion: filtros.ubicacion,
    bajoStock: filtros.stock === "alerta",
    estadoStock: filtros.stock === "bajo" || filtros.stock === "sin_stock" ? filtros.stock : "",
    // Sin orden elegido, los repuestos más críticos van primero; con una columna elegida manda esa columna.
    orden: filtros.ordenarPor ? undefined : "criticidad",
    ordenarPor: filtros.ordenarPor,
    direccionOrden: filtros.direccionOrden,
    pagina: filtros.pagina,
  };
}
