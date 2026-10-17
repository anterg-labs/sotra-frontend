import { apiCrearDocumentoTecnico } from "@/servicios/api/api-documentos-tecnicos";
import type { CrearDocumentoTecnicoInput } from "@/tipos/documento-tecnico";

export async function obtenerErrorArchivoPdf(archivo: File | null): Promise<string | null> {
  if (!archivo) return "Seleccioná un archivo PDF.";

  const nombreEnMinusculas = archivo.name.toLowerCase();
  if (!nombreEnMinusculas.endsWith(".pdf")) return "El archivo debe tener la extensión .pdf.";

  const primerosCaracteres = await archivo.slice(0, 5).text();
  if (primerosCaracteres !== "%PDF-") return "El archivo no es un PDF válido.";

  return null;
}

async function validarArchivoPdf(archivo: File | null) {
  const error = await obtenerErrorArchivoPdf(archivo);
  if (error) throw new Error(error);
  if (archivo === null) throw new Error("Seleccioná un archivo PDF.");
  return archivo;
}

/** La subida del PDF (multipart) sale directo del navegador a la API: ver la nota en el formulario de documentos. */
export async function crearDocumentoTecnico(input: CrearDocumentoTecnicoInput) {
  const archivoValidado = await validarArchivoPdf(input.archivo);
  return apiCrearDocumentoTecnico(archivoValidado, input.activoId, input.usaSugerenciasIA);
}
