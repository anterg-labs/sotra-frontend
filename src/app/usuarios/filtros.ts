import {
  construirUrlListado,
  leerEstado,
  leerIdFiltro,
  leerOrden,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosUsuarios } from "@/tipos/usuario";

export const RUTA_USUARIOS = "/usuarios";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_USUARIOS = ["nombre", "correo", "roles", "cantidadOrdenesAsignadas", "estado"] as const;

export function leerFiltrosUsuarios(parametros: ParametrosBusqueda): FiltrosUsuarios {
  return {
    buscar: primerValor(parametros.buscar),
    rolId: leerIdFiltro(parametros, "rolId"),
    estado: leerEstado(parametros),
    pagina: leerPagina(parametros), ...leerOrden(parametros, COLUMNAS_ORDENABLES_USUARIOS),
  };
}

export function construirUrlUsuarios(filtros: FiltrosUsuarios) {
  return construirUrlListado(RUTA_USUARIOS, filtros);
}
