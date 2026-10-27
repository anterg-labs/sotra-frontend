import "server-only";
import { parametrosDeOrden } from "@/componentes/listado/url-listado";
import { leerJsonServidor, opcionesJsonServidor, solicitarApiServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { ActualizarDocumentoTecnicoInput, DocumentoTecnico, FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
import type { Pagina } from "@/tipos/pagina";

export function listarDocumentosTecnicosServidor(filtros: FiltrosDocumentosTecnicos) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.activoId !== "") parametros.append("activoId", filtros.activoId);
  if (filtros.modeloMaquinaId !== "") parametros.append("modeloMaquinaId", filtros.modeloMaquinaId);
  if (filtros.tipo !== "") parametros.append("tipo", filtros.tipo);
  if (filtros.vigente !== "") parametros.append("vigente", filtros.vigente);
  for (const [nombre, valor] of parametrosDeOrden(filtros)) parametros.append(nombre, valor);
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

export function cambiarVigenciaDocumentoTecnicoServidor(documentoId: number, vigente: boolean) {
  return leerJsonServidor<DocumentoTecnico>(
    "/api/v1/documentos-tecnicos/" + documentoId + "/vigencia",
    "No se pudo cambiar la vigencia del documento.",
    opcionesJsonServidor("PATCH", { vigente }),
  );
}

export function actualizarDocumentoTecnicoServidor(documentoId: number, datos: ActualizarDocumentoTecnicoInput) {
  return leerJsonServidor<DocumentoTecnico>(
    "/api/v1/documentos-tecnicos/" + documentoId,
    "No se pudo guardar el documento.",
    opcionesJsonServidor("PUT", datos),
  );
}

export async function eliminarDocumentoTecnicoServidor(documentoId: number) {
  await solicitarApiServidor(
    "/api/v1/documentos-tecnicos/" + documentoId,
    { method: "DELETE" },
    "No se pudo eliminar el documento técnico.",
  );
}
