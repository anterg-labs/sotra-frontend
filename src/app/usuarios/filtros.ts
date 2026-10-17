import {
  construirUrlListado,
  leerEstado,
  leerIdFiltro,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosUsuarios } from "@/tipos/usuario";

export const RUTA_USUARIOS = "/usuarios";

export function leerFiltrosUsuarios(parametros: ParametrosBusqueda): FiltrosUsuarios {
  return {
    buscar: primerValor(parametros.buscar),
    rolId: leerIdFiltro(parametros, "rolId"),
    estado: leerEstado(parametros),
    pagina: leerPagina(parametros),
  };
}

export function construirUrlUsuarios(filtros: FiltrosUsuarios) {
  return construirUrlListado(RUTA_USUARIOS, filtros);
}
