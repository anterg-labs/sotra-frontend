import { construirUrlListado, leerEstado, leerPagina, primerValor, type ParametrosBusqueda } from "@/componentes/listado/url-listado";
import type { FiltrosTiposMaquina } from "@/tipos/tipo-maquina";

export const RUTA_TIPOS = "/activos/tipos";

export function leerFiltrosTipos(parametros: ParametrosBusqueda): FiltrosTiposMaquina {
  return { buscar: primerValor(parametros.buscar), estado: leerEstado(parametros), pagina: leerPagina(parametros) };
}

export function construirUrlTipos(filtros: FiltrosTiposMaquina) {
  return construirUrlListado(RUTA_TIPOS, filtros);
}
