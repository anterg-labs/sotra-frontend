import "server-only";
import { leerJsonServidor, opcionesJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { Usuario } from "@/tipos/usuario";

/** Datos que una persona puede cambiar de su propio perfil: el resto depende de Keycloak o de la administración. */
export type ActualizarPerfilInput = { nombre: string; apellido: string; telefono: string };

export function obtenerPerfilServidor() {
  return leerJsonServidor<Usuario>("/api/v1/perfil", "No se pudo obtener tu perfil.");
}

export function actualizarPerfilServidor(perfil: ActualizarPerfilInput) {
  return leerJsonServidor<Usuario>("/api/v1/perfil", "No se pudo actualizar tu perfil.", opcionesJsonServidor("PUT", perfil));
}
