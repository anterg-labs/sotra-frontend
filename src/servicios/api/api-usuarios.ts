import { crearOpcionesJson, leerDatosApi } from "@/servicios/api/solicitudes-http";
import type { ActualizarUsuarioInput, CrearUsuarioInput, Rol, Usuario } from "@/tipos/usuario";

export async function apiListarUsuarios() {
  const usuarios = await leerDatosApi("/api/v1/usuarios", { cache: "no-store" }, "No se pudo obtener el listado de usuarios.");
  return usuarios as Usuario[];
}

export async function apiListarRoles() {
  const roles = await leerDatosApi("/api/v1/roles", { cache: "no-store" }, "No se pudo obtener el listado de roles.");
  return roles as Rol[];
}

export async function apiObtenerUsuario(usuarioId: number) {
  const usuario = await leerDatosApi("/api/v1/usuarios/" + usuarioId, { cache: "no-store" }, "No se pudo obtener el usuario solicitado.");
  return usuario as Usuario;
}

export async function apiCrearUsuario(usuario: CrearUsuarioInput) {
  const opciones = crearOpcionesJson("POST", usuario);
  const usuarioCreado = await leerDatosApi("/api/v1/usuarios", opciones, "No se pudo crear el usuario.");
  return usuarioCreado as Usuario;
}

export async function apiActualizarUsuario(usuarioId: number, usuario: ActualizarUsuarioInput) {
  const opciones = crearOpcionesJson("PUT", usuario);
  const usuarioActualizado = await leerDatosApi("/api/v1/usuarios/" + usuarioId, opciones, "No se pudo actualizar el usuario.");
  return usuarioActualizado as Usuario;
}

export async function apiDesactivarUsuario(usuarioId: number) {
  const opciones = crearOpcionesJson("PATCH", { estado: "inactivo" });
  const usuarioActualizado = await leerDatosApi("/api/v1/usuarios/" + usuarioId, opciones, "No se pudo desactivar el usuario.");
  return usuarioActualizado as Usuario;
}
