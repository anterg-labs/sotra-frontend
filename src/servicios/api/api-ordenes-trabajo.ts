import { crearOpcionesJson, leerDatosApi, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import type {
  ActualizarOrdenTrabajoInput,
  CrearOrdenTrabajoInput,
  OrdenTrabajo,
  SolicitarSugerenciaInput,
  SugerenciaOrdenTrabajo,
} from "@/tipos/orden-trabajo";

export async function apiListarOrdenesTrabajo() {
  const ordenes = await leerDatosApi("/api/v1/ordenes-trabajo", { cache: "no-store" }, "No se pudo obtener el listado de órdenes de trabajo.");
  return ordenes as OrdenTrabajo[];
}

export async function apiObtenerOrdenTrabajo(ordenTrabajoId: number) {
  const orden = await leerDatosApi("/api/v1/ordenes-trabajo/" + ordenTrabajoId, { cache: "no-store" }, "No se pudo obtener la orden de trabajo solicitada.");
  return orden as OrdenTrabajo;
}

export async function apiCrearOrdenTrabajo(orden: CrearOrdenTrabajoInput) {
  const opciones = crearOpcionesJson("POST", orden);
  const ordenCreada = await leerDatosApi("/api/v1/ordenes-trabajo", opciones, "No se pudo crear la orden de trabajo.");
  return ordenCreada as OrdenTrabajo;
}

export async function apiActualizarOrdenTrabajo(ordenTrabajoId: number, orden: ActualizarOrdenTrabajoInput) {
  const opciones = crearOpcionesJson("PUT", orden);
  const ordenActualizada = await leerDatosApi("/api/v1/ordenes-trabajo/" + ordenTrabajoId, opciones, "No se pudo actualizar la orden de trabajo.");
  return ordenActualizada as OrdenTrabajo;
}

export async function apiSolicitarSugerenciaOrdenTrabajo(datosOrden: SolicitarSugerenciaInput) {
  const urlBaseApi = obtenerUrlBaseApi();
  const opciones = crearOpcionesJson("POST", datosOrden);
  const respuesta = await fetch(urlBaseApi + "/api/v1/ordenes-trabajo/sugerencia", opciones);
  if (respuesta.status === 422) {
    throw new Error("El sistema no encontró información suficiente en la documentación técnica para esta tarea.");
  }
  if (!respuesta.ok) {
    throw new Error("No se pudo obtener la sugerencia para la orden de trabajo.");
  }

  const sugerenciaObtenida = await respuesta.json();
  return sugerenciaObtenida as SugerenciaOrdenTrabajo;
}
