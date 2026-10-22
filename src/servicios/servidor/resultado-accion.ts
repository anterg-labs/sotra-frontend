import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";

/**
 * Traduce un error de la API al resultado de una Server Action: un código conocido (por ejemplo `CORREO_DUPLICADO`)
 * se asigna al campo del formulario; otros errores de la API, al mensaje general; lo inesperado, al mensaje genérico.
 * La redirección al login (sesión vencida) no es un error: se deja pasar.
 */
export function resultadoFallido<T>(
  error: unknown,
  campoPorCodigo: Record<string, string>,
  mensajeGeneral: string,
): ResultadoGuardar<T> {
  unstable_rethrow(error);
  if (error instanceof ErrorDeApi) {
    const campo = campoPorCodigo[error.codigo ?? ""];
    if (campo) return { exito: false, errores: { [campo]: error.message }, mensaje: "" };
    return { exito: false, errores: {}, mensaje: error.message };
  }
  return { exito: false, errores: {}, mensaje: mensajeGeneral };
}

export function esIdValido(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

export function esEstadoValido(estado: unknown): estado is "activo" | "inactivo" {
  return estado === "activo" || estado === "inactivo";
}

/** Texto opcional de una entrada no confiable: blanco o ausente es `null`; un tipo inválido es `undefined`. */
export function textoOpcional(valor: unknown): string | null | undefined {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== "string") return undefined;
  return valor.trim() === "" ? null : valor;
}

/** Valida los argumentos de una acción de baja o reactivación y ejecuta la llamada; nunca lanza. */
export async function ejecutarCambioEstado(
  id: unknown,
  estado: unknown,
  llamada: (id: number, estado: "activo" | "inactivo") => Promise<unknown>,
  alExito: () => void,
  mensajes: { baja: string; reactivacion: string },
): Promise<ResultadoCambiarEstado> {
  const mensaje = estado === "activo" ? mensajes.reactivacion : mensajes.baja;
  if (!esIdValido(id) || !esEstadoValido(estado)) return { exito: false, mensaje };

  try {
    await llamada(id, estado);
    alExito();
    return { exito: true };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ErrorDeApi && error.estadoHttp === 403) return { exito: false, mensaje: error.message };
    return { exito: false, mensaje };
  }
}
