import type { FiltrosIndicadores } from "@/tipos/reporte";
import type { ClienteDeReportes, ResumenPorCliente } from "@/tipos/resumen-por-cliente";
import { construirConsultaAnalisis } from "./consultas-reportes";
import { leerDatosApi } from "./solicitudes-http";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
const esCantidad = (valor: unknown): valor is number => typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0;
const esFecha = (valor: unknown): valor is string | null => valor === null ||
  (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(valor)));
function esCliente(valor: unknown): valor is ClienteDeReportes {
  return esObjeto(valor) && esCantidad(valor.clienteId) && valor.clienteId > 0 &&
    typeof valor.cliente === "string" && esCantidad(valor.ordenes) && valor.ordenes > 0 &&
    esCantidad(valor.correctivas) && valor.correctivas <= valor.ordenes &&
    esCantidad(valor.correctivasCerradas) && valor.correctivasCerradas <= valor.correctivas &&
    typeof valor.horasParada === "number" && Number.isFinite(valor.horasParada) && valor.horasParada >= 0 &&
    esCantidad(valor.reincidencias) && valor.reincidencias <= valor.correctivas;
}

export function leerResumenPorCliente(valor: unknown): ResumenPorCliente {
  if (esObjeto(valor) && esFecha(valor.fechaDesde) && esFecha(valor.fechaHasta) &&
    esCantidad(valor.diasReincidencia) && valor.diasReincidencia >= 1 && valor.diasReincidencia <= 3650 &&
    Array.isArray(valor.clientes) && valor.clientes.every(esCliente) &&
    new Set(valor.clientes.map(cliente => cliente.clienteId)).size === valor.clientes.length) {
    return { fechaDesde: valor.fechaDesde, fechaHasta: valor.fechaHasta,
      diasReincidencia: valor.diasReincidencia, clientes: valor.clientes };
  }
  throw new Error("La respuesta del resumen por cliente no tiene el formato esperado.");
}

export async function apiObtenerResumenPorCliente(filtros: FiltrosIndicadores) {
  return leerResumenPorCliente(await leerDatosApi("/api/v1/reportes/resumen-por-cliente" + construirConsultaAnalisis(filtros),
    { cache: "no-store" }, "No se pudo obtener el resumen por cliente."));
}
