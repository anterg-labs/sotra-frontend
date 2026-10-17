"use server";

import { revalidatePath } from "next/cache";
import {
  actualizarTipoMaquinaServidor,
  cambiarEstadoTipoMaquinaServidor,
  crearTipoMaquinaServidor,
} from "@/servicios/servidor/tipos-maquina";
import { ejecutarCambioEstado, esEstadoValido, resultadoFallido } from "@/servicios/servidor/resultado-accion";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";
import type { EstadoTipoMaquina, GuardarTipoMaquinaInput, TipoMaquina } from "@/tipos/tipo-maquina";
import { validarNombreCatalogo } from "@/validaciones/maquinaria";

const MENSAJE_GENERAL = "No se pudo guardar el tipo de máquina.";
const campoPorCodigoDuplicado = { TIPO_MAQUINA_DUPLICADO: "nombre" };

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
function leerNombre(datos: unknown): string | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { nombre } = datos as Record<string, unknown>;
  return typeof nombre === "string" ? nombre : null;
}

async function guardarTipo(
  datos: unknown,
  guardar: (nombre: string) => Promise<TipoMaquina>,
): Promise<ResultadoGuardar<TipoMaquina>> {
  const nombre = leerNombre(datos);
  if (nombre === null) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };

  const error = validarNombreCatalogo(nombre);
  if (error) return { exito: false, errores: { nombre: error }, mensaje: "" };

  try {
    const registro = await guardar(nombre);
    revalidatePath("/activos", "layout");
    return { exito: true, registro };
  } catch (excepcion) {
    return resultadoFallido(excepcion, campoPorCodigoDuplicado, MENSAJE_GENERAL);
  }
}

export async function crearTipoMaquinaAccion(datos: GuardarTipoMaquinaInput) {
  return guardarTipo(datos, (nombre) => crearTipoMaquinaServidor({ nombre }));
}

export async function actualizarTipoMaquinaAccion(tipoMaquinaId: number, datos: GuardarTipoMaquinaInput) {
  const estado = (datos as { estado?: unknown } | null)?.estado;
  if (!esEstadoValido(estado)) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL } satisfies ResultadoGuardar<TipoMaquina>;
  return guardarTipo(datos, (nombre) => actualizarTipoMaquinaServidor(tipoMaquinaId, { nombre, estado }));
}

export async function cambiarEstadoTipoMaquinaAccion(
  tipoMaquinaId: number,
  estado: EstadoTipoMaquina,
): Promise<ResultadoCambiarEstado> {
  return ejecutarCambioEstado(
    tipoMaquinaId,
    estado,
    cambiarEstadoTipoMaquinaServidor,
    () => revalidatePath("/activos", "layout"),
    {
      baja: "No se pudo dar de baja el tipo de máquina seleccionado.",
      reactivacion: "No se pudo reactivar el tipo de máquina seleccionado.",
    },
  );
}
