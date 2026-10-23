import { parametrosDeOrden } from "@/componentes/listado/url-listado";
import { leerPagina } from "@/servicios/api/solicitudes-http";
import type { FiltrosTiposMaquina, TipoMaquina } from "@/tipos/tipo-maquina";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarTiposMaquinaPaginados(filtros: FiltrosTiposMaquina) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  for (const [nombre, valor] of parametrosDeOrden(filtros)) parametros.append(nombre, valor);
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/tipos-maquina", parametros, "No se pudo obtener el listado de tipos de máquina.");
  return pagina as Pagina<TipoMaquina>;
}
