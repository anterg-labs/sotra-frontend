import "server-only";
import { construirConsultaOrdenes } from "@/servicios/api/consultas-ordenes";
import { leerJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import { listarRolesServidor, listarUsuariosServidor } from "@/servicios/servidor/usuarios";
import type { FiltrosOrdenesTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Pagina } from "@/tipos/pagina";

export function listarOrdenesTrabajoServidor(filtros: FiltrosOrdenesTrabajo) {
  return leerJsonServidor<Pagina<OrdenTrabajo>>(
    "/api/v1/ordenes-trabajo?" + construirConsultaOrdenes(filtros),
    "No se pudo obtener el listado de órdenes de trabajo.",
  );
}

export function obtenerOrdenTrabajoServidor(ordenTrabajoId: number) {
  return leerJsonServidor<OrdenTrabajo>(
    "/api/v1/ordenes-trabajo/" + ordenTrabajoId,
    "No se pudo obtener la orden de trabajo solicitada.",
  );
}

/** Técnicos activos (rol «Técnico»): el filtro por rol lo resuelve la API. Sin el rol, la lista queda vacía. */
export async function listarTecnicosServidor(buscar = "") {
  const roles = await listarRolesServidor();
  const rolTecnico = roles.find((rol) => rol.nombre === "Técnico");
  if (!rolTecnico) return [];

  const pagina = await listarUsuariosServidor({ buscar, rolId: String(rolTecnico.id), estado: "activo", pagina: 1 });
  return pagina.elementos;
}
