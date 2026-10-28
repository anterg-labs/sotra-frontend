import type { FiltrosIndicadores } from "@/tipos/reporte";
import type { ConsumoDeRepuestos } from "@/tipos/consumo-repuestos";
import { construirConsultaAnalisis } from "./consultas-reportes";
import { leerDatosApi } from "./solicitudes-http";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
const esEntero = (valor: unknown): valor is number => typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0;
const esFecha = (valor: unknown): valor is string | null => valor === null ||
  (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(valor)));

export function leerConsumoDeRepuestos(valor: unknown): ConsumoDeRepuestos {
  if (esObjeto(valor) && esFecha(valor.fechaDesde) && esFecha(valor.fechaHasta) &&
    esEntero(valor.totalUnidades) && Array.isArray(valor.repuestos) &&
    valor.repuestos.every(repuesto => esObjeto(repuesto) && esEntero(repuesto.repuestoId) && repuesto.repuestoId > 0 &&
      typeof repuesto.codigo === "string" && typeof repuesto.repuesto === "string" &&
      esEntero(repuesto.unidades) && repuesto.unidades > 0 && esEntero(repuesto.ordenes) && repuesto.ordenes > 0) &&
    new Set(valor.repuestos.map(repuesto => repuesto.repuestoId)).size === valor.repuestos.length &&
    valor.repuestos.reduce((total, repuesto) => total + repuesto.unidades, 0) === valor.totalUnidades) {
    return valor as ConsumoDeRepuestos;
  }
  throw new Error("La respuesta de consumo de repuestos no tiene el formato esperado.");
}

export async function apiObtenerConsumoDeRepuestos(filtros: FiltrosIndicadores) {
  return leerConsumoDeRepuestos(await leerDatosApi("/api/v1/reportes/consumo-repuestos" + construirConsultaAnalisis(filtros),
    { cache: "no-store" }, "No se pudo obtener el consumo de repuestos."));
}
