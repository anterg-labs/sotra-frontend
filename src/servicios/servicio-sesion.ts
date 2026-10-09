import type { UsuarioEnSesion } from "@/tipos/sesion";

export function obtenerUsuarioEnSesion(): UsuarioEnSesion | null {
  return null;
}

export async function cerrarSesion() {
  const usuarioEnSesion = obtenerUsuarioEnSesion();
  if (usuarioEnSesion === null) {
    return;
  }
}
