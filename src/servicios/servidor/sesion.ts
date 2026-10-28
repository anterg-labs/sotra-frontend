import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { tienePermiso, type Permiso } from "@/seguridad/permisos";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { leerUsuarioEnSesion, tieneAccesoASotra } from "@/servicios/servicio-sesion";
import { leerJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import { obtenerTokenAcceso } from "@/servicios/servidor/token-acceso";
import { registrarFalloSesion } from "@/servicios/servidor/registro-fallo-sesion";
import type { EstadoSesion } from "@/tipos/sesion";

/** Usuario de la sesión según la API (`GET /api/v1/sesion`), una vez por pedido. */
export const obtenerEstadoSesion = cache(async (): Promise<EstadoSesion> => {
  if (!(await obtenerTokenAcceso())) return { estado: "sin-sesion" };
  try {
    let respuesta: unknown;
    for (let intento = 0; intento < 3; intento += 1) {
      try {
        respuesta = await leerJsonServidor<unknown>("/api/v1/sesion", "No se pudo obtener la sesión.");
        break;
      } catch (error) {
        if (!(error instanceof ErrorDeApi) || error.estadoHttp < 500 || intento === 2) throw error;
        await new Promise((resolver) => setTimeout(resolver, 250 * (intento + 1)));
      }
    }
    const usuario = leerUsuarioEnSesion(respuesta);
    if (usuario === null) {
      await registrarFalloSesion("SESION_RESPUESTA_INVALIDA");
      return { estado: "error" };
    }
    return tieneAccesoASotra(usuario) ? { estado: "con-acceso", usuario } : { estado: "sin-acceso", usuario };
  } catch (error) {
    unstable_rethrow(error);
    await registrarFalloSesion(error instanceof ErrorDeApi && error.estadoHttp === 503
      ? "SESION_API_NO_DISPONIBLE" : "SESION_API_ERROR", error instanceof ErrorDeApi ? error.estadoHttp : null);
    return { estado: "error" };
  }
});

/** Para no pedir a la API datos que el rol no puede ver (respondería 403): por ejemplo, la lista de técnicos. */
export async function tienePermisoServidor(permiso: Permiso) {
  const sesion = await obtenerEstadoSesion();
  return sesion.estado === "con-acceso" && tienePermiso(sesion.usuario.roles, permiso);
}
