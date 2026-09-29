import { crearOpcionesJson, leerDatosApi } from "@/servicios/api/solicitudes-http";
import type { ActualizarRepuestoInput, CrearRepuestoInput, Repuesto } from "@/tipos/repuesto";

export async function apiListarRepuestos() {
  const repuestos = await leerDatosApi("/api/v1/repuestos", { cache: "no-store" }, "No se pudo obtener el listado de repuestos.");
  return repuestos as Repuesto[];
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
