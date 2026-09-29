import {
  apiActualizarUsuario,
  apiCrearUsuario,
  apiDesactivarUsuario,
  apiListarRoles,
  apiListarUsuarios,
  apiObtenerUsuario,
} from "@/servicios/api/api-usuarios";
import type { ActualizarUsuarioInput, CrearUsuarioInput } from "@/tipos/usuario";

const patronFormatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarUsuario(input: CrearUsuarioInput | ActualizarUsuarioInput) {
  if (input.idsRol.length === 0) {
    throw new Error("Debe seleccionar al menos un rol.");
  }

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

}

export async function listarUsuarios() {
  return apiListarUsuarios();
}

export async function listarRoles() {
  return apiListarRoles();
}

export async function obtenerDetalleUsuario(usuarioId: number) {
  return apiObtenerUsuario(usuarioId);
}

export async function crearUsuario(input: CrearUsuarioInput) {
  validarUsuario(input);

  if (!input.contrasena.trim()) {
    throw new Error("La contraseña es obligatoria.");
  }

  return apiCrearUsuario(input);
}

export async function actualizarUsuario(usuarioId: number, input: ActualizarUsuarioInput) {
  validarUsuario(input);
  return apiActualizarUsuario(usuarioId, input);
}

export async function desactivarUsuario(usuarioId: number) {
  return apiDesactivarUsuario(usuarioId);
}
