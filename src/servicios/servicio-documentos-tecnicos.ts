import {
  apiCrearDocumentoTecnico,
  apiEliminarDocumentoTecnico,
  apiListarDocumentosTecnicos,
  apiListarDocumentosTecnicosPaginados,
  apiObtenerDocumentoTecnico,
  apiObtenerUrlDescargaDocumentoTecnico,
} from "@/servicios/api/api-documentos-tecnicos";
import type { CrearDocumentoTecnicoInput, FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";

async function validarArchivoPdf(archivo: File | null) {
  if (!archivo) {
    throw new Error("Seleccioná un archivo PDF.");
  }

  const nombreEnMinusculas = archivo.name.toLowerCase();
  if (!nombreEnMinusculas.endsWith(".pdf")) {
    throw new Error("El archivo debe tener la extensión .pdf.");
  }

  const primerosCaracteres = await archivo.slice(0, 5).text();
  if (primerosCaracteres !== "%PDF-") {
    throw new Error("El archivo no es un PDF válido.");
  }

  return archivo;
}

export async function listarDocumentosTecnicos() {
  return apiListarDocumentosTecnicos();
}

export async function listarDocumentosTecnicosPaginados(filtros: FiltrosDocumentosTecnicos) {
  return apiListarDocumentosTecnicosPaginados(filtros);
}

export async function obtenerDetalleDocumentoTecnico(documentoId: number) {
  return apiObtenerDocumentoTecnico(documentoId);
}

export async function crearDocumentoTecnico(input: CrearDocumentoTecnicoInput) {
  const archivoValidado = await validarArchivoPdf(input.archivo);
  return apiCrearDocumentoTecnico(archivoValidado, input.activoId, input.usaSugerenciasIA);
}

export function obtenerUrlDescargaDocumentoTecnico(documentoId: number) {
  return apiObtenerUrlDescargaDocumentoTecnico(documentoId);
}

export async function eliminarDocumentoTecnico(documentoId: number) {
  return apiEliminarDocumentoTecnico(documentoId);
}
