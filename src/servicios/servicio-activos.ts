import { apiListarActivosPaginados, apiObtenerActivo } from "@/servicios/api/api-activos";
import type { FiltrosActivos } from "@/tipos/activo";

/** Lecturas desde el navegador (selectores de otros módulos). El alta, la modificación y la baja viven en las Server Actions de /activos. */
export async function listarActivosPaginados(filtros: FiltrosActivos) {
  return apiListarActivosPaginados(filtros);
}

export async function obtenerDetalleActivo(activoId: number) {
  return apiObtenerActivo(activoId);
}
