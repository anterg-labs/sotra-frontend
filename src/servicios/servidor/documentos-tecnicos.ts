import "server-only";
import { leerJsonServidor, solicitarApiServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { DocumentoTecnico, FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
import type { Pagina } from "@/tipos/pagina";

export function listarDocumentosTecnicosServidor(filtros: FiltrosDocumentosTecnicos) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.activoId !== "") parametros.append("activoId", filtros.activoId);
  parametros.append("pagina", String(filtros.pagina));
  return leerJsonServidor<Pagina<DocumentoTecnico>>(
    "/api/v1/documentos-tecnicos?" + parametros.toString(),
    "No se pudo obtener el listado de documentos técnicos.",
  );
}

export function obtenerDocumentoTecnicoServidor(documentoId: number) {
  return leerJsonServidor<DocumentoTecnico>(
    "/api/v1/documentos-tecnicos/" + documentoId,
    "No se pudo obtener el documento técnico solicitado.",
  );
}

export async function eliminarDocumentoTecnicoServidor(documentoId: number) {
  await solicitarApiServidor(
    "/api/v1/documentos-tecnicos/" + documentoId,
    { method: "DELETE" },
    "No se pudo eliminar el documento técnico.",
  );
}
