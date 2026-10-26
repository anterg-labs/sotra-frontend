import {
  construirUrlListado,
  leerIdFiltro,
  leerOrden,
  leerPagina,
  primerValor,
  siguienteOrden,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosOrdenesTrabajo, OpcionEstadoOrden } from "@/tipos/orden-trabajo";

export const RUTA_ORDENES = "/ordenes-trabajo";

/** Columnas por las que se puede ordenar; coinciden con las que acepta la API. */
export const COLUMNAS_ORDENABLES_ORDENES = ["id", "nombreCliente", "nombreActivo", "tipo", "prioridad", "nombreTecnico", "estado", "creadoEn", "fechaPrevistaEjecucion"] as const;

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function leerFecha(parametros: ParametrosBusqueda, nombre: string) {
  const valor = primerValor(parametros[nombre]);
  return PATRON_FECHA.test(valor) ? valor : "";
}

function leerOpcion(parametros: ParametrosBusqueda, nombre: string, validas: readonly string[]) {
  const valor = primerValor(parametros[nombre]);
  return validas.includes(valor) ? valor : "";
}

/** `estados` es el catálogo de la base: un estado de la URL que no esté ahí se descarta. */
export function leerFiltrosOrdenes(parametros: ParametrosBusqueda, estados: readonly OpcionEstadoOrden[]): FiltrosOrdenesTrabajo {
  return {
    buscar: primerValor(parametros.buscar),
    clienteId: leerIdFiltro(parametros, "clienteId"),
    activoId: leerIdFiltro(parametros, "activoId"),
    tecnicoId: leerIdFiltro(parametros, "tecnicoId"),
    estado: leerOpcion(parametros, "estado", estados.map((estado) => estado.valor)),
    fase: leerOpcion(parametros, "fase", estados.map((estado) => estado.fase)),
    prioridad: leerOpcion(parametros, "prioridad", ["alta", "media", "baja"]),
    tipo: leerOpcion(parametros, "tipo", ["preventivo", "correctivo"]),
    fechaDesde: leerFecha(parametros, "fechaDesde"),
    fechaHasta: leerFecha(parametros, "fechaHasta"),
    conSugerencias: primerValor(parametros.conSugerencias) === "true",
    pagina: leerPagina(parametros),
    ...leerOrden(parametros, COLUMNAS_ORDENABLES_ORDENES),
  };
}

export function construirUrlOrdenes(filtros: FiltrosOrdenesTrabajo) {
  return construirUrlListado(RUTA_ORDENES, { ...filtros, conSugerencias: filtros.conSugerencias ? "true" : "" });
}

/** URL del listado al hacer clic en el título de una columna: aplica el orden siguiente y vuelve a la página 1. */
export function urlOrdenOrdenes(filtros: FiltrosOrdenesTrabajo, columna: string) {
  const siguiente = siguienteOrden({ ordenarPor: filtros.ordenarPor ?? "", direccionOrden: filtros.direccionOrden ?? "" }, columna);
  return construirUrlOrdenes({ ...filtros, ...siguiente, pagina: 1 });
}
