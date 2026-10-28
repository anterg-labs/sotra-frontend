import type { Estacionalidad, MesEstacionalidad, TipoEstacionalidad } from "@/tipos/estacionalidad";
import type { FiltrosIndicadores } from "@/tipos/reporte";
import { construirConsultaAnalisis } from "./consultas-reportes";
import { leerDatosApi } from "./solicitudes-http";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
const esCantidad = (valor: unknown): valor is number => typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0;
const esFecha = (valor: unknown): valor is string | null => valor === null || (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(valor)));
function sonMeses(valor: unknown): valor is MesEstacionalidad[] {
  return Array.isArray(valor) && valor.length === 12 && valor.every((mes, indice) => esObjeto(mes) && mes.mes === indice + 1 && esCantidad(mes.correctivas));
}
function esTipo(valor: unknown): valor is TipoEstacionalidad {
  return esObjeto(valor) && esCantidad(valor.tipoMaquinaId) && valor.tipoMaquinaId > 0 && typeof valor.tipoMaquina === "string"
    && esCantidad(valor.total) && sonMeses(valor.meses) && valor.meses.reduce((suma, mes) => suma + mes.correctivas, 0) === valor.total;
}
/** Valida también que las partes coincidan con el total; no dibuja respuestas incompletas como ceros. */
export function leerEstacionalidad(valor: unknown): Estacionalidad {
  if (esObjeto(valor) && esFecha(valor.fechaDesde) && esFecha(valor.fechaHasta) && esCantidad(valor.total)
    && sonMeses(valor.meses) && Array.isArray(valor.tipos) && valor.tipos.every(esTipo)
    && new Set(valor.tipos.map(tipo => tipo.tipoMaquinaId)).size === valor.tipos.length
    && valor.tipos.reduce((suma, tipo) => suma + tipo.total, 0) === valor.total) {
    const { fechaDesde, fechaHasta, total, meses, tipos } = valor;
    if (meses.every((mes, indice) => mes.correctivas === tipos.reduce((suma, tipo) => suma + tipo.meses[indice].correctivas, 0))) {
      return { fechaDesde, fechaHasta, total, meses, tipos };
    }
  }
  throw new Error("La respuesta de estacionalidad no tiene el formato esperado.");
}
export async function apiObtenerEstacionalidad(filtros: FiltrosIndicadores) {
  return leerEstacionalidad(await leerDatosApi("/api/v1/reportes/estacionalidad" + construirConsultaAnalisis(filtros),
    { cache: "no-store" }, "No se pudo obtener la estacionalidad de las correctivas."));
}
