import {
  apiCrearEvidencia,
  apiListarEvidencias,
  apiObtenerUrlArchivoEvidencia,
} from "@/servicios/api/api-evidencias";
import type { CrearEvidenciaInput } from "@/tipos/evidencia";

const tamanoMaximoEnBytes = 10 * 1024 * 1024;

const etiquetasTipoEvidencia: Record<string, string> = {
  foto: "Foto",
  documento: "Documento",
  observacion: "Observación",
};

export function obtenerEtiquetaTipoEvidencia(tipo: string) {
  return etiquetasTipoEvidencia[tipo];
}

import { obtenerFechaDeHoy } from "@/validaciones/fecha";

export { obtenerFechaDeHoy };

export async function listarEvidencias(ordenTrabajoId: number) {
  return apiListarEvidencias(ordenTrabajoId);
}

export function obtenerErroresEvidencia(input: CrearEvidenciaInput) {
  const errores: Partial<Record<"tipo" | "fechaRegistro" | "observacion" | "archivo", string>> = {};
  if (input.tipo === "") errores.tipo = "Seleccioná el tipo de evidencia.";
  if (input.fechaRegistro === "") errores.fechaRegistro = "Indicá la fecha de registro.";
  else if (input.fechaRegistro > obtenerFechaDeHoy()) errores.fechaRegistro = "La fecha de registro no puede ser futura.";
  if (input.tipo === "observacion" && input.observacion.trim() === "") {
    errores.observacion = "Escribí la observación de la evidencia.";
  }
  if (input.tipo !== "observacion" && input.archivo === null) errores.archivo = "Adjuntá el archivo de la evidencia.";
  if (input.archivo !== null && input.archivo.size > tamanoMaximoEnBytes) errores.archivo = "El archivo supera 10 MB.";
  return errores;
}

export async function crearEvidencia(ordenTrabajoId: number, input: CrearEvidenciaInput) {
  const primerError = Object.values(obtenerErroresEvidencia(input))[0];
  if (primerError) throw new Error(primerError);
  return apiCrearEvidencia(ordenTrabajoId, input);
}

export function obtenerUrlArchivoEvidencia(ordenTrabajoId: number, evidenciaId: number) {
  return apiObtenerUrlArchivoEvidencia(ordenTrabajoId, evidenciaId);
}
