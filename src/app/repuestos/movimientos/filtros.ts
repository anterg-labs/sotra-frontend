import {
  construirUrlListado,
  leerIdFiltro,
  leerPagina,
  primerValor,
  type ParametrosBusqueda,
} from "@/componentes/listado/url-listado";
import type { FiltrosMovimientosStock } from "@/tipos/movimiento-stock";

export const RUTA_MOVIMIENTOS = "/repuestos/movimientos";

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function leerFecha(parametros: ParametrosBusqueda, nombre: string) {
  const valor = primerValor(parametros[nombre]);
  return PATRON_FECHA.test(valor) ? valor : "";
}

export function leerFiltrosMovimientos(parametros: ParametrosBusqueda): FiltrosMovimientosStock {
  const tipo = primerValor(parametros.tipo);
  return {
    buscar: primerValor(parametros.buscar),
    repuestoId: leerIdFiltro(parametros, "repuestoId"),
    tipo: tipo === "ingreso" || tipo === "egreso" || tipo === "ajuste" ? tipo : "",
    fechaDesde: leerFecha(parametros, "fechaDesde"),
    fechaHasta: leerFecha(parametros, "fechaHasta"),
    ubicacion: primerValor(parametros.ubicacion),
    usuarioId: leerIdFiltro(parametros, "usuarioId"),
    pagina: leerPagina(parametros),
  };
}

export function construirUrlMovimientos(filtros: FiltrosMovimientosStock) {
  return construirUrlListado(RUTA_MOVIMIENTOS, filtros);
}
