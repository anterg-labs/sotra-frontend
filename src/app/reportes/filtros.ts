import { construirUrlListado, leerIdFiltro, primerValor, type ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { estadosOrdenTrabajo } from "@/tipos/orden-trabajo";
import type { FiltrosIndicadores } from "@/tipos/reporte";

export const RUTA_REPORTES = "/reportes";

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function leerFecha(parametros: ParametrosBusqueda, nombre: string) {
  const valor = primerValor(parametros[nombre]);
  return PATRON_FECHA.test(valor) ? valor : "";
}

export function leerFiltrosReportes(parametros: ParametrosBusqueda): FiltrosIndicadores {
  const estado = primerValor(parametros.estado);
  const tipo = primerValor(parametros.tipo);
  return {
    fechaDesde: leerFecha(parametros, "fechaDesde"),
    fechaHasta: leerFecha(parametros, "fechaHasta"),
    tecnicoId: leerIdFiltro(parametros, "tecnicoId"),
    clienteId: leerIdFiltro(parametros, "clienteId"),
    activoId: leerIdFiltro(parametros, "activoId"),
    estado: (estadosOrdenTrabajo as string[]).includes(estado) ? estado : "",
    tipo: tipo === "preventivo" || tipo === "correctivo" ? tipo : "",
  };
}

export function construirUrlReportes(filtros: FiltrosIndicadores) {
  return construirUrlListado(RUTA_REPORTES, filtros);
}
