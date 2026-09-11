import {
  apiActualizarUsuario,
  apiCrearUsuario,
  apiDesactivarUsuario,
  apiListarRoles,
  apiListarUsuarios,
  apiObtenerUsuario,
} from "@/servicios/cliente-api";
import type {
  ActualizarUsuarioInput,
  CrearUsuarioInput,
  Rol,
  Usuario,
  UsuarioListado,
} from "@/tipos/usuario";

const patronFormatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function convertirAListado(usuario: Usuario, roles: Rol[]): UsuarioListado {
  const rol = roles.find((rolActual) => rolActual.id === usuario.rolId);

  return {
    ...usuario,
    nombreRol: rol?.nombre ?? "Sin rol asignado",
  };
}

function validarUsuario(input: CrearUsuarioInput | ActualizarUsuarioInput, roles: Rol[]) {
  if (!input.nombre.trim()) {
    throw new Error("El nombre es obligatorio.");
  }

  if (!input.apellido.trim()) {
    throw new Error("El apellido es obligatorio.");
  }

  if (!patronFormatoCorreo.test(input.correo)) {
    throw new Error("El correo electrónico no tiene un formato válido.");
  }

  if (!input.telefono.trim()) {
    throw new Error("El número de teléfono es obligatorio.");
  }

  if (!roles.some((rol) => rol.id === input.rolId)) {
    throw new Error("El rol seleccionado no es válido.");
  }
}

export async function listarRoles() {
  const roles = await apiListarRoles();
  return roles;
}

export async function listarUsuarios() {
  const usuarios = await apiListarUsuarios();
  const roles = await listarRoles();
  return usuarios.map((usuario) => convertirAListado(usuario, roles));
}

export async function obtenerDetalleUsuario(usuarioId: number) {
  const roles = await listarRoles();
  const usuario = await apiObtenerUsuario(usuarioId);

  return convertirAListado(usuario, roles);
}

export async function crearUsuario(input: CrearUsuarioInput) {
  const roles = await listarRoles();

  validarUsuario(input, roles);

  if (!input.contrasenaTemporal.trim()) {
    throw new Error("La contraseña temporal es obligatoria.");
  }

  return apiCrearUsuario(input);
}

export async function actualizarUsuario(usuarioId: number, input: ActualizarUsuarioInput) {
  const roles = await listarRoles();

  validarUsuario(input, roles);
  return apiActualizarUsuario(usuarioId, input);
}

export async function desactivarUsuario(usuarioId: number) {
  return apiDesactivarUsuario(usuarioId);
}
