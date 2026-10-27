import { leerDatosApi, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import type { CrearDocumentoTecnicoInput, DocumentoTecnico } from "@/tipos/documento-tecnico";

export async function apiCrearDocumentoTecnico(archivo: File, datos: Omit<CrearDocumentoTecnicoInput, "archivo">) {
  const datosFormulario = new FormData();
  datosFormulario.append("archivo", archivo);
  datosFormulario.append("usaSugerenciasIA", String(datos.usaSugerenciasIA));
  datosFormulario.append("tipo", datos.tipo);
  if (datos.titulo.trim() !== "") datosFormulario.append("titulo", datos.titulo.trim());
  if (datos.descripcion.trim() !== "") datosFormulario.append("descripcion", datos.descripcion.trim());
  if (datos.activoId !== null) datosFormulario.append("activoId", String(datos.activoId));
  if (datos.modeloMaquinaId !== null) datosFormulario.append("modeloMaquinaId", String(datos.modeloMaquinaId));

  const opciones = { method: "POST", body: datosFormulario };
  const documentoCreado = await leerDatosApi("/api/v1/documentos-tecnicos", opciones, "No se pudo guardar el documento.");
  return documentoCreado as DocumentoTecnico;
}

/** Enlace de descarga al mismo origen: el reenvío de `/api/v1` le agrega el token de la sesión. */
export function apiObtenerUrlDescargaDocumentoTecnico(documentoId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  return urlBaseApi + "/api/v1/documentos-tecnicos/" + documentoId + "/archivo";
}
