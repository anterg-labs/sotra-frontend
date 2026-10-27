import {
  construirUrlListado,
  leerEstado,
  leerIdFiltro,
  leerOrden,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosActivos } from "@/tipos/activo";

export const RUTA_ACTIVOS = "/activos";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_ACTIVOS = ["nombre", "numSerie", "nombreCliente", "nombreModeloMaquina", "estado"] as const;

export function leerFiltrosActivos(parametros: ParametrosBusqueda): FiltrosActivos {
  return {
    buscar: primerValor(parametros.buscar),
    clienteId: leerIdFiltro(parametros, "clienteId"),
    modeloMaquinaId: leerIdFiltro(parametros, "modeloMaquinaId"),
    estado: leerEstado(parametros),
    pagina: leerPagina(parametros), ...leerOrden(parametros, COLUMNAS_ORDENABLES_ACTIVOS),
  };
}

export function construirUrlActivos(filtros: FiltrosActivos) {
  return construirUrlListado(RUTA_ACTIVOS, filtros);
}
