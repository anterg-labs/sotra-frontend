import { enviarPedidoApi, leerDatosApi, leerPagina, leerTodasLasPaginas, obtenerUrlBaseApi } from "@/servicios/api/solicitudes-http";
import type { DocumentoTecnico, FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarDocumentosTecnicos() {
  const documentos = await leerTodasLasPaginas("/api/v1/documentos-tecnicos", "No se pudo obtener el listado de documentos técnicos.");
  return documentos as DocumentoTecnico[];
}

export async function apiListarDocumentosTecnicosPaginados(filtros: FiltrosDocumentosTecnicos) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.activoId !== "") {
    parametros.append("activoId", filtros.activoId);
  }
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/documentos-tecnicos", parametros, "No se pudo obtener el listado de documentos técnicos.");
  return pagina as Pagina<DocumentoTecnico>;
}

export async function apiObtenerDocumentoTecnico(documentoId: number) {
  const documento = await leerDatosApi("/api/v1/documentos-tecnicos/" + documentoId, { cache: "no-store" }, "No se pudo obtener el documento técnico solicitado.");
  return documento as DocumentoTecnico;
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
