import { filtrarRolesSotra } from "@/seguridad/permisos";
import type { UsuarioEnSesion } from "@/tipos/sesion";

/** Acepta solo la forma esperada de `/api/v1/sesion`; los roles que no son de SOTRA se descartan. */
export function leerUsuarioEnSesion(datos: unknown): UsuarioEnSesion | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { idKeycloak, idUsuario, correo, nombre, roles } = datos as Record<string, unknown>;
  if (typeof idKeycloak !== "string" || !(idUsuario === null || typeof idUsuario === "number")) return null;
  return {
    idKeycloak,
    idUsuario,
    correo: typeof correo === "string" ? correo : "",
    nombre: typeof nombre === "string" ? nombre : "",
    roles: Array.isArray(roles) ? filtrarRolesSotra(roles.filter((rol): rol is string => typeof rol === "string")) : [],
  };
}

/** Puede usar SOTRA quien está registrado en SOTRA y tiene al menos un rol. */
export function tieneAccesoASotra(usuario: UsuarioEnSesion) {
  return usuario.idUsuario !== null && usuario.roles.length > 0;
}

/** Iniciales para el avatar: primera letra de las dos primeras palabras del nombre (o del correo). */
export function obtenerIniciales(usuario: UsuarioEnSesion) {
  const palabras = (usuario.nombre.trim() || usuario.correo.trim()).split(/\s+/).filter(Boolean);
  return palabras.slice(0, 2).map((palabra) => palabra.charAt(0)).join("").toLocaleUpperCase("es");
}

/** Ruta que cierra la sesión de SOTRA y la de Keycloak (`src/app/logout/route.ts`). */
export const RUTA_CIERRE_SESION = "/logout";

/**
 * Cierra la sesión de SOTRA y la de Keycloak con un POST de formulario a `/logout`: es una navegación completa,
 * así que nada de la página actual se vuelve a pedir con la sesión ya cerrada. Keycloak vuelve a la página principal,
 * que pide el login otra vez.
 */
export async function cerrarSesion() {
  const formulario = document.createElement("form");
  formulario.method = "POST";
  formulario.action = RUTA_CIERRE_SESION;
  formulario.hidden = true;
  document.body.appendChild(formulario);
  formulario.submit();
}
