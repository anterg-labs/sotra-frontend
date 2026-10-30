import "server-only";
import { parametrosDeOrden } from "@/componentes/listado/url-listado";
import { leerJsonServidor, opcionesJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { Pagina } from "@/tipos/pagina";
import type {
  ActualizarRepuestoInput,
  AlertasStock,
  CrearRepuestoInput,
  EstadoRepuesto,
  FiltrosRepuestos,
  Repuesto,
} from "@/tipos/repuesto";

export function listarRepuestosServidor(filtros: FiltrosRepuestos) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.estado !== "") parametros.append("estado", filtros.estado);
  if (filtros.ubicacion.trim() !== "") parametros.append("ubicacion", filtros.ubicacion.trim());
  if (filtros.categoria?.trim()) parametros.append("categoria", filtros.categoria.trim());
  if (filtros.bajoStock) parametros.append("bajoStock", "true");
  if (filtros.estadoStock) parametros.append("estadoStock", filtros.estadoStock);
  if (filtros.orden) parametros.append("orden", filtros.orden);
  for (const [nombre, valor] of parametrosDeOrden(filtros)) parametros.append(nombre, valor);
  parametros.append("pagina", String(filtros.pagina));
  return leerJsonServidor<Pagina<Repuesto>>(
    "/api/v1/repuestos?" + parametros.toString(),
    "No se pudo obtener el listado de repuestos.",
  );
}

export function obtenerAlertasStockServidor() {
  return leerJsonServidor<AlertasStock>("/api/v1/repuestos/alertas-stock", "No se pudieron obtener las alertas de stock.");
}

export function obtenerRepuestoServidor(repuestoId: number) {
  return leerJsonServidor<Repuesto>("/api/v1/repuestos/" + repuestoId, "No se pudo obtener el repuesto solicitado.");
}

export function crearRepuestoServidor(repuesto: CrearRepuestoInput) {
  return leerJsonServidor<Repuesto>("/api/v1/repuestos", "No se pudo crear el repuesto.", opcionesJsonServidor("POST", repuesto));
}

export function actualizarRepuestoServidor(repuestoId: number, repuesto: ActualizarRepuestoInput) {
  return leerJsonServidor<Repuesto>(
    "/api/v1/repuestos/" + repuestoId,
    "No se pudo actualizar el repuesto.",
    opcionesJsonServidor("PUT", repuesto),
  );
}

export function cambiarEstadoRepuestoServidor(repuestoId: number, estado: EstadoRepuesto) {
  return leerJsonServidor<Repuesto>(
    "/api/v1/repuestos/" + repuestoId,
    estado === "activo" ? "No se pudo reactivar el repuesto." : "No se pudo dar de baja el repuesto.",
    opcionesJsonServidor("PATCH", { estado }),
  );
}

export function actualizarStockMinimoServidor(repuestoId: number, cantidadMinima: number) {
  return leerJsonServidor<Repuesto>(
    "/api/v1/repuestos/" + repuestoId + "/stock-minimo",
    "No se pudo actualizar el stock mínimo.",
    opcionesJsonServidor("PATCH", { cantidadMinima }),
  );
}
