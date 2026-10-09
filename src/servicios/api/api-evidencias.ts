import { leerDatosApi, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import type { CrearEvidenciaInput, Evidencia } from "@/tipos/evidencia";

export async function apiListarEvidencias(ordenTrabajoId: number) {
  const ruta = "/api/v1/ordenes-trabajo/" + ordenTrabajoId + "/evidencias";
  const evidencias = await leerDatosApi(ruta, { cache: "no-store" }, "No se pudo obtener el listado de evidencias.");
  return evidencias as Evidencia[];
}

export async function apiCrearEvidencia(ordenTrabajoId: number, input: CrearEvidenciaInput) {
  const datosFormulario = new FormData();
  datosFormulario.append("tipo", input.tipo);
  datosFormulario.append("observacion", input.observacion);
  datosFormulario.append("fechaRegistro", input.fechaRegistro);
  if (input.archivo !== null) {
    datosFormulario.append("archivo", input.archivo);
  }

  const ruta = "/api/v1/ordenes-trabajo/" + ordenTrabajoId + "/evidencias";
  const opciones = { method: "POST", body: datosFormulario };
  const evidenciaCreada = await leerDatosApi(ruta, opciones, "No se pudo registrar la evidencia.");
  return evidenciaCreada as Evidencia;
}

export function apiObtenerUrlArchivoEvidencia(ordenTrabajoId: number, evidenciaId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  return urlBaseApi + "/api/v1/ordenes-trabajo/" + ordenTrabajoId + "/evidencias/" + evidenciaId + "/archivo";
}
