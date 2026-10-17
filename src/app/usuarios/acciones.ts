"use server";

import { revalidatePath } from "next/cache";
import { ejecutarCambioEstado, esEstadoValido, resultadoFallido } from "@/servicios/servidor/resultado-accion";
import {
  actualizarUsuarioServidor,
  cambiarEstadoUsuarioServidor,
  crearUsuarioServidor,
} from "@/servicios/servidor/usuarios";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";
import type { CrearUsuarioInput, EstadoUsuario, Usuario } from "@/tipos/usuario";
import { validarUsuario } from "@/validaciones/usuario";

const MENSAJE_GENERAL = "No se pudo guardar la información del usuario.";

const campoPorCodigoDuplicado = { TELEFONO_DUPLICADO: "telefono", CORREO_DUPLICADO: "correo" };

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
function leerEntrada(datos: unknown): CrearUsuarioInput | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { nombre, apellido, correo, telefono, contrasena, idsRol } = datos as Record<string, unknown>;
  if (
    typeof nombre !== "string" ||
    typeof apellido !== "string" ||
    typeof correo !== "string" ||
    typeof telefono !== "string" ||
    !(contrasena === undefined || typeof contrasena === "string") ||
    !Array.isArray(idsRol) ||
    !idsRol.every((id) => Number.isInteger(id) && id > 0)
  ) {
    return null;
  }
  return { nombre, apellido, correo, telefono, contrasena: contrasena ?? "", idsRol: idsRol as number[] };
}

async function guardarUsuario(
  datos: unknown,
  exigirContrasena: boolean,
  guardar: (usuario: CrearUsuarioInput) => Promise<Usuario>,
): Promise<ResultadoGuardar<Usuario>> {
  const entrada = leerEntrada(datos);
  if (!entrada) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };

  const errores = validarUsuario(entrada, { exigirContrasena });
  if (Object.keys(errores).length > 0) return { exito: false, errores, mensaje: "" };
  if (entrada.idsRol.length === 0) return { exito: false, errores: {}, mensaje: "Debe seleccionar al menos un rol." };

  try {
    const registro = await guardar(entrada);
    revalidatePath("/usuarios", "layout");
    return { exito: true, registro };
  } catch (error) {
    return resultadoFallido(error, campoPorCodigoDuplicado, MENSAJE_GENERAL);
  }
}

export async function crearUsuarioAccion(datos: CrearUsuarioInput) {
  return guardarUsuario(datos, true, crearUsuarioServidor);
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
  return guardarUsuario(datos, false, (usuario) =>
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

export async function cambiarEstadoUsuarioAccion(usuarioId: number, estado: EstadoUsuario): Promise<ResultadoCambiarEstado> {
  return ejecutarCambioEstado(
    usuarioId,
    estado,
    cambiarEstadoUsuarioServidor,
    () => revalidatePath("/usuarios", "layout"),
    { baja: "No se pudo desactivar el usuario seleccionado.", reactivacion: "No se pudo reactivar el usuario seleccionado." },
  );
}
