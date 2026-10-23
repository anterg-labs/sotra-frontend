"use server";

import { revalidatePath } from "next/cache";
import { ejecutarCambioEstado, esEstadoValido, esIdValido, resultadoFallido } from "@/servicios/servidor/resultado-accion";
import {
  actualizarUsuarioServidor,
  cambiarEstadoUsuarioServidor,
  crearUsuarioServidor,
  restablecerContrasenaServidor,
} from "@/servicios/servidor/usuarios";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";
import type { CrearUsuarioInput, EstadoUsuario, Usuario } from "@/tipos/usuario";
import { validarUsuario } from "@/validaciones/usuario";

const MENSAJE_GENERAL = "No se pudo guardar la información del usuario.";

const campoPorCodigoDuplicado = { TELEFONO_DUPLICADO: "telefono", CORREO_DUPLICADO: "correo" };

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
function leerEntrada(datos: unknown): CrearUsuarioInput | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { nombre, apellido, correo, telefono, idsRol } = datos as Record<string, unknown>;
  if (
    typeof nombre !== "string" ||
    typeof apellido !== "string" ||
    typeof correo !== "string" ||
    typeof telefono !== "string" ||
    !Array.isArray(idsRol) ||
    !idsRol.every((id) => Number.isInteger(id) && id > 0)
  ) {
    return null;
  }
  return { nombre, apellido, correo, telefono, idsRol: idsRol as number[] };
}

async function guardarUsuario(
  datos: unknown,
  guardar: (usuario: CrearUsuarioInput) => Promise<Usuario>,
): Promise<ResultadoGuardar<Usuario>> {
  const entrada = leerEntrada(datos);
  if (!entrada) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };

  const errores: Record<string, string> = { ...validarUsuario(entrada) };
  if (entrada.idsRol.length === 0) errores.idsRol = "Debe seleccionar al menos un rol.";
  if (Object.keys(errores).length > 0) return { exito: false, errores, mensaje: "" };

  try {
    const registro = await guardar(entrada);
    revalidatePath("/usuarios", "layout");
    return { exito: true, registro };
  } catch (error) {
    return resultadoFallido(error, campoPorCodigoDuplicado, MENSAJE_GENERAL);
  }
}

export async function crearUsuarioAccion(datos: CrearUsuarioInput) {
  return guardarUsuario(datos, crearUsuarioServidor);
}

/** El estado y la fecha de ingreso actuales viajan ligados (`bind`) desde la página de edición. */
export async function actualizarUsuarioAccion(
  usuarioId: number,
  estado: EstadoUsuario,
  fechaIngreso: string,
  datos: CrearUsuarioInput,
) {
  if (!esEstadoValido(estado) || typeof fechaIngreso !== "string") {
    return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL } satisfies ResultadoGuardar<Usuario>;
  }
  return guardarUsuario(datos, (usuario) =>
    actualizarUsuarioServidor(usuarioId, {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      telefono: usuario.telefono,
      idsRol: usuario.idsRol,
      estado,
      fechaIngreso,
    }),
  );
}

const MENSAJE_RESTABLECER = "No se pudo enviar el correo para restablecer la contraseña.";

/**
 * Reenvía al usuario el correo de Keycloak para elegir una contraseña nueva. La API responde 409 con
 * `USUARIO_SIN_ACCESO` (cargado antes de Keycloak) o `USUARIO_INACTIVO`, y 502 si Keycloak no responde: se muestra su mensaje.
 */
export async function restablecerContrasenaAccion(usuarioId: number): Promise<ResultadoCambiarEstado> {
  if (!esIdValido(usuarioId)) return { exito: false, mensaje: MENSAJE_RESTABLECER };
  try {
    await restablecerContrasenaServidor(usuarioId);
    return { exito: true };
  } catch (error) {
    const resultado = resultadoFallido<never>(error, {}, MENSAJE_RESTABLECER);
    return { exito: false, mensaje: resultado.exito ? MENSAJE_RESTABLECER : resultado.mensaje };
  }
}

export async function cambiarEstadoUsuarioAccion(usuarioId: number, estado: EstadoUsuario): Promise<ResultadoCambiarEstado> {
  return ejecutarCambioEstado(
    usuarioId,
    estado,
    cambiarEstadoUsuarioServidor,
    () => revalidatePath("/usuarios", "layout"),
    { baja: "No se pudo desactivar el usuario seleccionado.", reactivacion: "No se pudo reactivar el usuario seleccionado." },
  );
}
