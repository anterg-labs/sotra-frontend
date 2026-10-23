import {
  construirUrlListado,
  leerIdFiltro,
  leerOrden,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import { esTipoDocumento, type FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";

export const RUTA_DOCUMENTOS = "/documentacion-tecnica";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_DOCUMENTOS = ["titulo", "tipo", "vigente", "nombreAsociado", "usaSugerenciasIA", "creadoEn"] as const;

function leerTipoDocumento(parametros: ParametrosBusqueda) {
  const tipo = primerValor(parametros.tipo);
  return esTipoDocumento(tipo) ? tipo : "";
}

function leerVigencia(parametros: ParametrosBusqueda) {
  const vigente = primerValor(parametros.vigente);
  return vigente === "true" || vigente === "false" ? vigente : "";
}

export function leerFiltrosDocumentos(parametros: ParametrosBusqueda): FiltrosDocumentosTecnicos {
  return {
    buscar: primerValor(parametros.buscar),
    activoId: leerIdFiltro(parametros, "activoId"),
    modeloMaquinaId: leerIdFiltro(parametros, "modeloMaquinaId"),
    tipo: leerTipoDocumento(parametros),
    vigente: leerVigencia(parametros),
    pagina: leerPagina(parametros),
    ...leerOrden(parametros, COLUMNAS_ORDENABLES_DOCUMENTOS),
  };
}

export function construirUrlDocumentos(filtros: FiltrosDocumentosTecnicos) {
  return construirUrlListado(RUTA_DOCUMENTOS, filtros);
}
