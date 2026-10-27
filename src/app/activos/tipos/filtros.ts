import { construirUrlListado, leerEstado, leerOrden, leerPagina, primerValor, type ParametrosBusqueda } from "@/componentes/listado/url-listado";
import type { FiltrosTiposMaquina } from "@/tipos/tipo-maquina";

export const RUTA_TIPOS = "/activos/tipos";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_TIPOS = ["nombre", "estado"] as const;

export function leerFiltrosTipos(parametros: ParametrosBusqueda): FiltrosTiposMaquina {
  return { buscar: primerValor(parametros.buscar), estado: leerEstado(parametros), pagina: leerPagina(parametros), ...leerOrden(parametros, COLUMNAS_ORDENABLES_TIPOS) };
}

export function construirUrlTipos(filtros: FiltrosTiposMaquina) {
  return construirUrlListado(RUTA_TIPOS, filtros);
}
