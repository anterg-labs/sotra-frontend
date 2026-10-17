import {
  construirUrlListado,
  leerIdFiltro,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";

export const RUTA_DOCUMENTOS = "/documentacion-tecnica";

export function leerFiltrosDocumentos(parametros: ParametrosBusqueda): FiltrosDocumentosTecnicos {
  return {
    buscar: primerValor(parametros.buscar),
    activoId: leerIdFiltro(parametros, "activoId"),
    pagina: leerPagina(parametros),
  };
}

export function construirUrlDocumentos(filtros: FiltrosDocumentosTecnicos) {
  return construirUrlListado(RUTA_DOCUMENTOS, filtros);
}
