import {
  construirUrlListado,
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

/** Sin parámetro se muestran activos; `todos` desactiva el filtro de la API. */
function leerEstadoUsuarios(parametros: ParametrosBusqueda): FiltrosUsuarios["estado"] {
  const estado = primerValor(parametros.estado);
  if (estado === "inactivo") return "inactivo";
  return estado === "todos" ? "" : "activo";
}

export function estadoUsuariosParaUrl(estado: FiltrosUsuarios["estado"]) {
  if (estado === "") return "todos";
  return estado === "activo" ? "" : estado;
}

export function leerFiltrosUsuarios(parametros: ParametrosBusqueda): FiltrosUsuarios {
  return {
    buscar: primerValor(parametros.buscar),
    rolId: leerIdFiltro(parametros, "rolId"),
    estado: leerEstadoUsuarios(parametros),
    pagina: leerPagina(parametros), ...leerOrden(parametros, COLUMNAS_ORDENABLES_USUARIOS),
  };
}

export function construirUrlUsuarios(filtros: FiltrosUsuarios) {
  return construirUrlListado(RUTA_USUARIOS, { ...filtros, estado: estadoUsuariosParaUrl(filtros.estado) });
}
