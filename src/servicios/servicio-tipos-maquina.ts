import { apiListarTiposMaquinaPaginados } from "@/servicios/api/api-tipos-maquina";
import type { FiltrosTiposMaquina } from "@/tipos/tipo-maquina";

/** Lectura desde el navegador (filtros y selectores buscables). El alta, la modificación y la baja viven en las Server Actions de /activos/tipos. */
export async function listarTiposMaquinaPaginados(filtros: FiltrosTiposMaquina) {
  return apiListarTiposMaquinaPaginados(filtros);
}
