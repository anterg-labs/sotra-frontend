import {
  construirUrlListado,
  leerEstado,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosRepuestos } from "@/tipos/repuesto";

export const RUTA_REPUESTOS = "/repuestos";

export type FiltroStock = "" | "alerta" | "bajo" | "sin_stock";

/** Filtros tal como viajan en la URL; `stock` agrupa `bajoStock` y `estadoStock` de la API. */
export type FiltrosUrlRepuestos = {
  buscar: string;
  estado: string;
  ubicacion: string;
  stock: FiltroStock;
  pagina: number;
};

export function leerFiltrosRepuestos(parametros: ParametrosBusqueda): FiltrosUrlRepuestos {
  const stock = primerValor(parametros.stock);
  return {
    buscar: primerValor(parametros.buscar),
    estado: leerEstado(parametros),
    ubicacion: primerValor(parametros.ubicacion),
    stock: stock === "alerta" || stock === "bajo" || stock === "sin_stock" ? stock : "",
    pagina: leerPagina(parametros),
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
    orden: "criticidad",
    pagina: filtros.pagina,
  };
}
