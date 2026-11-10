import { apiListarOrdenesComprometidas, apiListarRepuestosPaginados, apiObtenerAlertasStock, apiObtenerRepuesto } from "@/servicios/api/api-repuestos";
import type { FiltrosRepuestos, OrdenComprometida } from "@/tipos/repuesto";

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

/** Órdenes que tienen unidades del repuesto reservadas o entregadas; con `estado`, solo las de ese estado. */
export async function listarOrdenesComprometidas(repuestoId: number, estado?: OrdenComprometida["estadoRepuesto"]) {
  return apiListarOrdenesComprometidas(repuestoId, estado);
}
