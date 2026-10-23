import {
  construirUrlListado,
  leerEstado,
  leerIdFiltro,
  leerOrden,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosModelosMaquina } from "@/tipos/modelo-maquina";

export const RUTA_MODELOS = "/activos/modelos";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_MODELOS = ["nombre", "nombreTipoMaquina", "descripcion", "estado"] as const;

export function leerFiltrosModelos(parametros: ParametrosBusqueda): FiltrosModelosMaquina {
  return {
    buscar: primerValor(parametros.buscar),
    tipoMaquinaId: leerIdFiltro(parametros, "tipoMaquinaId"),
    estado: leerEstado(parametros),
    pagina: leerPagina(parametros), ...leerOrden(parametros, COLUMNAS_ORDENABLES_MODELOS),
  };
}

export function construirUrlModelos(filtros: FiltrosModelosMaquina) {
  return construirUrlListado(RUTA_MODELOS, filtros);
}
