import {
  construirUrlListado,
  leerIdFiltro,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import { estadosOrdenTrabajo, type FiltrosOrdenesTrabajo } from "@/tipos/orden-trabajo";

export const RUTA_ORDENES = "/ordenes-trabajo";

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function leerFecha(parametros: ParametrosBusqueda, nombre: string) {
  const valor = primerValor(parametros[nombre]);
  return PATRON_FECHA.test(valor) ? valor : "";
}

function leerOpcion(parametros: ParametrosBusqueda, nombre: string, validas: readonly string[]) {
  const valor = primerValor(parametros[nombre]);
  return validas.includes(valor) ? valor : "";
}

export function leerFiltrosOrdenes(parametros: ParametrosBusqueda): FiltrosOrdenesTrabajo {
  return {
    buscar: primerValor(parametros.buscar),
    clienteId: leerIdFiltro(parametros, "clienteId"),
    activoId: leerIdFiltro(parametros, "activoId"),
    tecnicoId: leerIdFiltro(parametros, "tecnicoId"),
    estado: leerOpcion(parametros, "estado", estadosOrdenTrabajo),
    prioridad: leerOpcion(parametros, "prioridad", ["alta", "media", "baja"]),
    tipo: leerOpcion(parametros, "tipo", ["preventivo", "correctivo"]),
    fechaDesde: leerFecha(parametros, "fechaDesde"),
    fechaHasta: leerFecha(parametros, "fechaHasta"),
    conSugerencias: primerValor(parametros.conSugerencias) === "true",
    pagina: leerPagina(parametros),
  };
}

export function construirUrlOrdenes(filtros: FiltrosOrdenesTrabajo) {
  return construirUrlListado(RUTA_ORDENES, { ...filtros, conSugerencias: filtros.conSugerencias ? "true" : "" });
}
