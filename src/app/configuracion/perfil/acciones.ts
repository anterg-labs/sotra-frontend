"use server";

import { revalidatePath } from "next/cache";
import { resultadoFallido } from "@/servicios/servidor/resultado-accion";
import { actualizarPerfilServidor, type ActualizarPerfilInput } from "@/servicios/servidor/perfil";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { Usuario } from "@/tipos/usuario";
import { validarNombrePersona, validarTelefono } from "@/validaciones/usuario";

const MENSAJE_GENERAL = "No se pudo actualizar tu perfil.";

function leerEntrada(datos: unknown): ActualizarPerfilInput | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { nombre, apellido, telefono } = datos as Record<string, unknown>;
  if (typeof nombre !== "string" || typeof apellido !== "string" || typeof telefono !== "string") return null;
  return { nombre, apellido, telefono };
}

/** Una Server Action es un endpoint público: la entrada se revisa y la API vuelve a validar y a decidir de quién es el perfil. */
export async function actualizarPerfilAccion(datos: unknown): Promise<ResultadoGuardar<Usuario>> {
  const entrada = leerEntrada(datos);
  if (!entrada) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };

  const errores: Record<string, string> = {};
  const errorNombre = validarNombrePersona(entrada.nombre, "Nombre");
  const errorApellido = validarNombrePersona(entrada.apellido, "Apellido");
  const errorTelefono = validarTelefono(entrada.telefono);
  if (errorNombre) errores.nombre = errorNombre;
  if (errorApellido) errores.apellido = errorApellido;
  if (errorTelefono) errores.telefono = errorTelefono;
  if (Object.keys(errores).length > 0) return { exito: false, errores, mensaje: "" };

  try {
    const registro = await actualizarPerfilServidor(entrada);
    revalidatePath("/", "layout");
    return { exito: true, registro };
  } catch (error) {
    return resultadoFallido<Usuario>(error, { TELEFONO_DUPLICADO: "telefono" }, MENSAJE_GENERAL);
  }
}
