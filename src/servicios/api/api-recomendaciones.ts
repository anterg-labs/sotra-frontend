import { crearOpcionesJson, leerDatosApi } from "@/servicios/api/solicitudes-http";
import type { Recomendacion } from "@/tipos/recomendacion";

export async function apiListarRecomendaciones(ordenTrabajoId: number) {
  const ruta = "/api/v1/ordenes-trabajo/" + ordenTrabajoId + "/sugerencias";
  const recomendaciones = await leerDatosApi(ruta, { cache: "no-store" }, "No se pudieron obtener las recomendaciones.");
  return recomendaciones as Recomendacion[];
}

export async function apiValidarRecomendacion(
  ordenTrabajoId: number,
  recomendacionId: number,
  resultado: string,
  observacion: string,
) {
  const ruta = "/api/v1/ordenes-trabajo/" + ordenTrabajoId + "/sugerencias/" + recomendacionId + "/validaciones";
  const opciones = crearOpcionesJson("POST", { resultado: resultado, observacion: observacion });
  const recomendacion = await leerDatosApi(ruta, opciones, "No se pudo registrar la validación.");
  return recomendacion as Recomendacion;
}
