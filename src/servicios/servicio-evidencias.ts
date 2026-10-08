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

export function obtenerFechaDeHoy() {
  const hoy = new Date();
  const anio = String(hoy.getFullYear());
  let mes = String(hoy.getMonth() + 1);
  if (mes.length === 1) {
    mes = "0" + mes;
  }
  let dia = String(hoy.getDate());
  if (dia.length === 1) {
    dia = "0" + dia;
  }
  return anio + "-" + mes + "-" + dia;
}

export async function listarEvidencias(ordenTrabajoId: number) {
  return apiListarEvidencias(ordenTrabajoId);
}

export async function crearEvidencia(ordenTrabajoId: number, input: CrearEvidenciaInput) {
  if (input.tipo === "") {
    throw new Error("Seleccioná el tipo de evidencia.");
  }

  if (input.fechaRegistro === "") {
    throw new Error("Indicá la fecha de registro.");
  }

  if (input.fechaRegistro > obtenerFechaDeHoy()) {
    throw new Error("La fecha de registro no puede ser futura.");
  }

  if (input.tipo === "observacion" && input.observacion.trim() === "") {
    throw new Error("Escribí la observación de la evidencia.");
  }

  if (input.tipo !== "observacion" && input.archivo === null) {
    throw new Error("Adjuntá el archivo de la evidencia.");
  }

  if (input.archivo !== null && input.archivo.size > tamanoMaximoEnBytes) {
    throw new Error("El archivo supera 10 MB.");
  }

  return apiCrearEvidencia(ordenTrabajoId, input);
}

export function obtenerUrlArchivoEvidencia(ordenTrabajoId: number, evidenciaId: number) {
  return apiObtenerUrlArchivoEvidencia(ordenTrabajoId, evidenciaId);
}
