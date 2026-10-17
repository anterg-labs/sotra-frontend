import "server-only";
import { leerJsonServidor, opcionesJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { Activo, ActualizarActivoInput, CrearActivoInput, EstadoActivo, FiltrosActivos } from "@/tipos/activo";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";
import type { Pagina } from "@/tipos/pagina";

export function listarActivosServidor(filtros: FiltrosActivos) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.clienteId !== "") parametros.append("clienteId", filtros.clienteId);
  if (filtros.modeloMaquinaId !== "") parametros.append("modeloMaquinaId", filtros.modeloMaquinaId);
  if (filtros.estado !== "") parametros.append("estado", filtros.estado);
  parametros.append("pagina", String(filtros.pagina));
  return leerJsonServidor<Pagina<Activo>>("/api/v1/activos?" + parametros.toString(), "No se pudo obtener el listado de activos.");
}

export function obtenerActivoServidor(activoId: number) {
  return leerJsonServidor<Activo>("/api/v1/activos/" + activoId, "No se pudo obtener el activo solicitado.");
}

export function crearActivoServidor(activo: CrearActivoInput) {
  return leerJsonServidor<Activo>("/api/v1/activos", "No se pudo crear el activo.", opcionesJsonServidor("POST", activo));
}

export function actualizarActivoServidor(activoId: number, activo: ActualizarActivoInput) {
  return leerJsonServidor<Activo>(
    "/api/v1/activos/" + activoId,
    "No se pudo actualizar el activo.",
    opcionesJsonServidor("PUT", activo),
  );
}

export function cambiarEstadoActivoServidor(activoId: number, estado: EstadoActivo) {
  return leerJsonServidor<Activo>(
    "/api/v1/activos/" + activoId,
    estado === "activo" ? "No se pudo reactivar el activo." : "No se pudo desactivar el activo.",
    opcionesJsonServidor("PATCH", { estado }),
  );
}

/** Documentos técnicos de un activo (primera página), para su pantalla de detalle. */
export function listarDocumentosDeActivoServidor(activoId: number) {
  const parametros = new URLSearchParams({ activoId: String(activoId), pagina: "1" });
  return leerJsonServidor<Pagina<DocumentoTecnico>>(
    "/api/v1/documentos-tecnicos?" + parametros.toString(),
    "No se pudo obtener el listado de documentos técnicos.",
  );
}
