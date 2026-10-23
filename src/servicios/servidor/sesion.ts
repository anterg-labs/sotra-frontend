import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { tienePermiso, type Permiso } from "@/seguridad/permisos";
import { leerUsuarioEnSesion, tieneAccesoASotra } from "@/servicios/servicio-sesion";
import { leerJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import { obtenerTokenAcceso } from "@/servicios/servidor/token-acceso";
import type { EstadoSesion } from "@/tipos/sesion";

/** Usuario de la sesión según la API (`GET /api/v1/sesion`), una vez por pedido. */
export const obtenerEstadoSesion = cache(async (): Promise<EstadoSesion> => {
  if (!(await obtenerTokenAcceso())) return { estado: "sin-sesion" };
  try {
    const usuario = leerUsuarioEnSesion(await leerJsonServidor<unknown>("/api/v1/sesion", "No se pudo obtener la sesión."));
    if (usuario === null) return { estado: "error" };
    return tieneAccesoASotra(usuario) ? { estado: "con-acceso", usuario } : { estado: "sin-acceso", usuario };
  } catch (error) {
    unstable_rethrow(error);
    return { estado: "error" };
  }
});

/** Para no pedir a la API datos que el rol no puede ver (respondería 403): por ejemplo, la lista de técnicos. */
export async function tienePermisoServidor(permiso: Permiso) {
  const sesion = await obtenerEstadoSesion();
  return sesion.estado === "con-acceso" && tienePermiso(sesion.usuario.roles, permiso);
}
