import "server-only";
import { leerJsonServidor, opcionesJsonServidor, solicitarApiServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { Pagina } from "@/tipos/pagina";
import type { ActualizarUsuarioInput, CrearUsuarioInput, EstadoUsuario, FiltrosUsuarios, Rol, Usuario } from "@/tipos/usuario";

export function listarUsuariosServidor(filtros: FiltrosUsuarios) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.rolId !== "") parametros.append("rolId", filtros.rolId);
  if (filtros.estado !== "") parametros.append("estado", filtros.estado);
  parametros.append("direccionOrden", "desc");
  parametros.append("pagina", String(filtros.pagina));
  return leerJsonServidor<Pagina<Usuario>>("/api/v1/usuarios?" + parametros.toString(), "No se pudo obtener el listado de usuarios.");
}

export function listarRolesServidor() {
  return leerJsonServidor<Rol[]>("/api/v1/roles", "No se pudo obtener el listado de roles.");
}

export function obtenerUsuarioServidor(usuarioId: number) {
  return leerJsonServidor<Usuario>("/api/v1/usuarios/" + usuarioId, "No se pudo obtener el usuario solicitado.");
}

export function crearUsuarioServidor(usuario: CrearUsuarioInput) {
  return leerJsonServidor<Usuario>("/api/v1/usuarios", "No se pudo crear el usuario.", opcionesJsonServidor("POST", usuario));
}

export function actualizarUsuarioServidor(usuarioId: number, usuario: ActualizarUsuarioInput) {
  return leerJsonServidor<Usuario>(
    "/api/v1/usuarios/" + usuarioId,
    "No se pudo actualizar el usuario.",
    opcionesJsonServidor("PUT", usuario),
  );
}

/** `POST /usuarios/{id}/restablecer-contrasena`: responde 204 sin cuerpo. */
export async function restablecerContrasenaServidor(usuarioId: number) {
  await solicitarApiServidor(
    "/api/v1/usuarios/" + usuarioId + "/restablecer-contrasena",
    { method: "POST" },
    "No se pudo enviar el correo para restablecer la contraseña.",
  );
}

export function cambiarEstadoUsuarioServidor(usuarioId: number, estado: EstadoUsuario) {
  return leerJsonServidor<Usuario>(
    "/api/v1/usuarios/" + usuarioId,
    estado === "activo" ? "No se pudo reactivar el usuario." : "No se pudo desactivar el usuario.",
    opcionesJsonServidor("PATCH", { estado }),
  );
}
