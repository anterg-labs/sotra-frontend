import { crearOpcionesJson, leerDatosApi, leerPagina, leerTodasLasPaginas } from "@/servicios/api/solicitudes-http";
import type { ActualizarActivoInput, Activo, CrearActivoInput, FiltrosActivos } from "@/tipos/activo";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarActivos() {
  const activos = await leerTodasLasPaginas("/api/v1/activos", "No se pudo obtener el listado de activos.");
  return activos as Activo[];
}

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
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/activos", parametros, "No se pudo obtener el listado de activos.");
  return pagina as Pagina<Activo>;
}

export async function apiObtenerActivo(activoId: number) {
  const activo = await leerDatosApi("/api/v1/activos/" + activoId, { cache: "no-store" }, "No se pudo obtener el activo solicitado.");
  return activo as Activo;
}

export async function apiCrearActivo(activo: CrearActivoInput) {
  const opciones = crearOpcionesJson("POST", activo);
  const activoCreado = await leerDatosApi("/api/v1/activos", opciones, "No se pudo crear el activo.");
  return activoCreado as Activo;
}

export async function apiActualizarActivo(activoId: number, activo: ActualizarActivoInput) {
  const opciones = crearOpcionesJson("PUT", activo);
  const activoActualizado = await leerDatosApi("/api/v1/activos/" + activoId, opciones, "No se pudo actualizar el activo.");
  return activoActualizado as Activo;
}

export async function apiDesactivarActivo(activoId: number) {
  const opciones = crearOpcionesJson("PATCH", { estado: "inactivo" });
  const activoActualizado = await leerDatosApi("/api/v1/activos/" + activoId, opciones, "No se pudo desactivar el activo.");
  return activoActualizado as Activo;
}
