import { apiListarModelosMaquinaPaginados } from "@/servicios/api/api-modelos-maquina";
import type { FiltrosModelosMaquina } from "@/tipos/modelo-maquina";

/** Lectura desde el navegador (filtros y selectores buscables). El alta, la modificación y la baja viven en las Server Actions de /activos/modelos. */
export async function listarModelosMaquinaPaginados(filtros: FiltrosModelosMaquina) {
  return apiListarModelosMaquinaPaginados(filtros);
}
