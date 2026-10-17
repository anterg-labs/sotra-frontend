import { apiListarRepuestosPaginados, apiObtenerAlertasStock, apiObtenerRepuesto } from "@/servicios/api/api-repuestos";
import type { FiltrosRepuestos } from "@/tipos/repuesto";

/** Lecturas desde el navegador (selectores, contador del menú). Las escrituras viven en las Server Actions de /repuestos. */
export async function listarRepuestosPaginados(filtros: FiltrosRepuestos) {
  return apiListarRepuestosPaginados(filtros);
}

export async function obtenerAlertasStock() {
  return apiObtenerAlertasStock();
}

export async function obtenerDetalleRepuesto(repuestoId: number) {
  return apiObtenerRepuesto(repuestoId);
}
