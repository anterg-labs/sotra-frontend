import { enviarPedidoApi, leerDatosApi, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";

export async function apiListarDocumentosTecnicos() {
  const documentos = await leerDatosApi("/api/v1/documentos-tecnicos", { cache: "no-store" }, "No se pudo obtener el listado de documentos técnicos.");
  return documentos as DocumentoTecnico[];
}

export async function apiCrearDocumentoTecnico(archivo: File, activoId: number | null, usaSugerenciasIA: boolean) {
  const datosFormulario = new FormData();
  datosFormulario.append("archivo", archivo);
  datosFormulario.append("usaSugerenciasIA", String(usaSugerenciasIA));
  if (activoId !== null) {
    datosFormulario.append("activoId", String(activoId));
  }

  const opciones = { method: "POST", body: datosFormulario };
  const documentoCreado = await leerDatosApi("/api/v1/documentos-tecnicos", opciones, "No se pudo guardar el documento técnico.");
  return documentoCreado as DocumentoTecnico;
}

export function apiObtenerUrlDescargaDocumentoTecnico(documentoId: number) {
  const urlBaseApi = obtenerUrlBaseApi();
  return urlBaseApi + "/api/v1/documentos-tecnicos/" + documentoId + "/archivo";
}

export async function apiEliminarDocumentoTecnico(documentoId: number) {
  await enviarPedidoApi("/api/v1/documentos-tecnicos/" + documentoId, { method: "DELETE" }, "No se pudo eliminar el documento técnico.");
}
