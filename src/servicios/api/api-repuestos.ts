import { crearOpcionesJson, leerDatosApi, leerPagina, leerTodasLasPaginas } from "@/servicios/api/solicitudes-http";
import type { Pagina } from "@/tipos/pagina";
import type { ActualizarRepuestoInput, CrearRepuestoInput, FiltrosRepuestos, Repuesto } from "@/tipos/repuesto";

export async function apiListarRepuestos() {
  const repuestos = await leerTodasLasPaginas("/api/v1/repuestos", "No se pudo obtener el listado de repuestos.");
  return repuestos as Repuesto[];
}

export async function apiListarRepuestosPaginados(filtros: FiltrosRepuestos) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  if (filtros.ubicacion.trim() !== "") {
    parametros.append("ubicacion", filtros.ubicacion.trim());
  }
  if (filtros.bajoStock) {
    parametros.append("bajoStock", "true");
  }
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/repuestos", parametros, "No se pudo obtener el listado de repuestos.");
  return pagina as Pagina<Repuesto>;
}

export async function apiObtenerRepuesto(repuestoId: number) {
  const repuesto = await leerDatosApi("/api/v1/repuestos/" + repuestoId, { cache: "no-store" }, "No se pudo obtener el repuesto solicitado.");
  return repuesto as Repuesto;
}

export async function apiCrearRepuesto(repuesto: CrearRepuestoInput) {
  const opciones = crearOpcionesJson("POST", repuesto);
  const repuestoCreado = await leerDatosApi("/api/v1/repuestos", opciones, "No se pudo crear el repuesto.");
  return repuestoCreado as Repuesto;
}

export async function apiActualizarRepuesto(repuestoId: number, repuesto: ActualizarRepuestoInput) {
  const opciones = crearOpcionesJson("PUT", repuesto);
  const repuestoActualizado = await leerDatosApi("/api/v1/repuestos/" + repuestoId, opciones, "No se pudo actualizar el repuesto.");
  return repuestoActualizado as Repuesto;
}

export async function apiDesactivarRepuesto(repuestoId: number) {
  const opciones = crearOpcionesJson("PATCH", { estado: "inactivo" });
  const repuestoActualizado = await leerDatosApi("/api/v1/repuestos/" + repuestoId, opciones, "No se pudo dar de baja el repuesto.");
  return repuestoActualizado as Repuesto;
}
