import { parametrosDeOrden } from "@/componentes/listado/url-listado";
import { leerDatosApi, leerPagina } from "@/servicios/api/solicitudes-http";
import type { Activo, FiltrosActivos } from "@/tipos/activo";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarActivosPaginados(filtros: FiltrosActivos) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.clienteId !== "") {
    parametros.append("clienteId", filtros.clienteId);
  }
  if (filtros.modeloMaquinaId !== "") {
    parametros.append("modeloMaquinaId", filtros.modeloMaquinaId);
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  for (const [nombre, valor] of parametrosDeOrden(filtros)) parametros.append(nombre, valor);
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/activos", parametros, "No se pudo obtener el listado de activos.");
  return pagina as Pagina<Activo>;
}

export async function apiObtenerActivo(activoId: number) {
  const activo = await leerDatosApi("/api/v1/activos/" + activoId, { cache: "no-store" }, "No se pudo obtener el activo solicitado.");
  return activo as Activo;
}
