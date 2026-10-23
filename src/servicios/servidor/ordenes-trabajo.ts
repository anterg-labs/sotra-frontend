import "server-only";
import { construirConsultaOrdenes } from "@/servicios/api/consultas-ordenes";
import { leerJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import { construirConsultaTecnicos, esTecnicoActivo } from "@/servicios/api/api-usuarios";
import type { FiltrosOrdenesTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Pagina } from "@/tipos/pagina";
import type { Usuario } from "@/tipos/usuario";

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

/**
 * Técnicos para elegir en una orden: el técnico actual va primero aunque ya no esté activo. Si no está en la lista,
 * se arma con el nombre que trae la orden (`/api/v1/usuarios/{id}` es solo del administrador).
 */
export function conTecnicoDeLaOrden(orden: OrdenTrabajo, tecnicos: Usuario[]): Usuario[] {
  if (orden.tecnicoId === null) return tecnicos;
  const actual = tecnicos.find((tecnico) => tecnico.id === orden.tecnicoId) ?? {
    id: orden.tecnicoId,
    nombre: orden.nombreTecnico ?? "Técnico #" + orden.tecnicoId,
    apellido: "",
    correo: "",
    telefono: "",
    roles: [],
    estado: "inactivo",
    fechaIngreso: "",
    cantidadOrdenesAsignadas: 0,
  };
  return [actual, ...tecnicos.filter((tecnico) => tecnico.id !== actual.id)];
}

/**
 * Técnicos activos (rol «Técnico»). Se filtra por el nombre del rol: `/api/v1/roles` es solo del administrador y el
 * jefe de mantenimiento también necesita la lista para asignar órdenes.
 */
export async function listarTecnicosServidor(buscar = "") {
  const pagina = await leerJsonServidor<Pagina<Usuario>>(
    "/api/v1/usuarios?" + construirConsultaTecnicos(buscar).toString(),
    "No se pudo obtener el listado de técnicos.",
  );
  return pagina.elementos.filter(esTecnicoActivo);
}
