import type { FiltrosIndicadores } from "@/tipos/reporte";
import type { ModeloConRepuestos, RepuestosPorModelo } from "@/tipos/repuestos-por-modelo";
import { construirConsultaAnalisis } from "./consultas-reportes";
import { leerDatosApi } from "./solicitudes-http";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
const esCantidad = (valor: unknown): valor is number => typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0;
const esId = (valor: unknown): valor is number => esCantidad(valor) && valor > 0;
const esFecha = (valor: unknown): valor is string | null => valor === null ||
  (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(valor)));

function esModelo(valor: unknown): valor is ModeloConRepuestos {
  if (!esObjeto(valor) || !esId(valor.modeloId) || typeof valor.modelo !== "string" ||
    !esId(valor.tipoMaquinaId) || typeof valor.tipoMaquina !== "string" || !Array.isArray(valor.repuestos)) return false;
  const repuestos = valor.repuestos;
  return repuestos.length > 0 && new Set(repuestos.map(repuesto => esObjeto(repuesto) ? repuesto.repuestoId : null)).size === repuestos.length &&
    repuestos.every(repuesto => esObjeto(repuesto) && esId(repuesto.repuestoId) &&
      typeof repuesto.codigo === "string" && typeof repuesto.repuesto === "string" &&
      esCantidad(repuesto.ordenesAsociadas) && repuesto.ordenesAsociadas > 0 &&
      esCantidad(repuesto.ordenesSuministradas) && repuesto.ordenesSuministradas <= repuesto.ordenesAsociadas);
}

export function leerRepuestosPorModelo(valor: unknown): RepuestosPorModelo {
  if (esObjeto(valor) && esFecha(valor.fechaDesde) && esFecha(valor.fechaHasta) &&
    Array.isArray(valor.modelos) && valor.modelos.every(esModelo) &&
    new Set(valor.modelos.map(modelo => modelo.modeloId)).size === valor.modelos.length) {
    return { fechaDesde: valor.fechaDesde, fechaHasta: valor.fechaHasta, modelos: valor.modelos };
  }
  throw new Error("La respuesta de repuestos por modelo no tiene el formato esperado.");
}

export async function apiObtenerRepuestosPorModelo(filtros: FiltrosIndicadores) {
  return leerRepuestosPorModelo(await leerDatosApi("/api/v1/reportes/repuestos-por-modelo" + construirConsultaAnalisis(filtros),
    { cache: "no-store" }, "No se pudieron obtener los repuestos por modelo."));
}
