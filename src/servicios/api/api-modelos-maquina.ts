import { leerPagina } from "@/servicios/api/solicitudes-http";
import type { FiltrosModelosMaquina, ModeloMaquina } from "@/tipos/modelo-maquina";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarModelosMaquinaPaginados(filtros: FiltrosModelosMaquina) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.tipoMaquinaId !== "") {
    parametros.append("tipoMaquinaId", filtros.tipoMaquinaId);
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/modelos-maquina", parametros, "No se pudo obtener el listado de modelos de máquina.");
  return pagina as Pagina<ModeloMaquina>;
}
