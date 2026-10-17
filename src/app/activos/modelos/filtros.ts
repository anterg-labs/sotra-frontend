import {
  construirUrlListado,
  leerEstado,
  leerIdFiltro,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosModelosMaquina } from "@/tipos/modelo-maquina";

export const RUTA_MODELOS = "/activos/modelos";

export function leerFiltrosModelos(parametros: ParametrosBusqueda): FiltrosModelosMaquina {
  return {
    buscar: primerValor(parametros.buscar),
    tipoMaquinaId: leerIdFiltro(parametros, "tipoMaquinaId"),
    estado: leerEstado(parametros),
    pagina: leerPagina(parametros),
  };
}

export function construirUrlModelos(filtros: FiltrosModelosMaquina) {
  return construirUrlListado(RUTA_MODELOS, filtros);
}
