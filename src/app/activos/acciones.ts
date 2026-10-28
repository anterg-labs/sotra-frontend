"use server";

import { revalidatePath } from "next/cache";
import {
  actualizarActivoServidor,
  cambiarEstadoActivoServidor,
  crearActivoServidor,
} from "@/servicios/servidor/activos";
import { ejecutarCambioEstado, esEstadoValido, esIdValido, resultadoFallido, textoOpcional } from "@/servicios/servidor/resultado-accion";
import type { Activo, CrearActivoInput, EstadoActivo, GuardarActivoInput } from "@/tipos/activo";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";
import { validarActivo } from "@/validaciones/activo";

const MENSAJE_GENERAL = "No se pudo guardar la información del activo.";
const campoPorCodigoDuplicado = { NUMERO_SERIE_DUPLICADO: "numSerie" };

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
function leerEntrada(datos: unknown): CrearActivoInput | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { clienteId, numSerie, descripcion, modeloMaquinaId, anioFabricacion, nombre, ubicacion, unidadUso } = datos as Record<string, unknown>;
  const descripcionLimpia = textoOpcional(descripcion);
  const nombreLimpio = textoOpcional(nombre);
  const ubicacionLimpia = textoOpcional(ubicacion);
  if (
    typeof clienteId !== "number" ||
    typeof modeloMaquinaId !== "number" ||
    typeof numSerie !== "string" ||
    !(anioFabricacion === null || typeof anioFabricacion === "number") ||
    !(unidadUso === undefined || unidadUso === "horas" || unidadUso === "kilometros") ||
    descripcionLimpia === undefined ||
    nombreLimpio === undefined ||
    ubicacionLimpia === undefined
  ) {
    return null;
  }
  return {
    clienteId,
    numSerie,
    descripcion: descripcionLimpia,
    modeloMaquinaId,
    anioFabricacion,
    nombre: nombreLimpio,
    ubicacion: ubicacionLimpia,
    ...(unidadUso === undefined ? {} : { unidadUso }),
  };
}

async function guardarActivo(
  datos: unknown,
  guardar: (activo: CrearActivoInput) => Promise<Activo>,
): Promise<ResultadoGuardar<Activo>> {
  const entrada = leerEntrada(datos);
  if (!entrada) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };

  const errores = validarActivo({
    nombre: entrada.nombre ?? "",
    numSerie: entrada.numSerie,
    clienteId: esIdValido(entrada.clienteId) ? String(entrada.clienteId) : "",
    modeloMaquinaId: esIdValido(entrada.modeloMaquinaId) ? String(entrada.modeloMaquinaId) : "",
    anioFabricacion: entrada.anioFabricacion === null ? "" : String(entrada.anioFabricacion),
    ubicacion: entrada.ubicacion ?? "",
  });
  if (Object.keys(errores).length > 0) return { exito: false, errores, mensaje: "" };

  try {
    const registro = await guardar(entrada);
    revalidatePath("/activos", "layout");
    return { exito: true, registro };
  } catch (error) {
    return resultadoFallido(error, campoPorCodigoDuplicado, MENSAJE_GENERAL);
  }
}

export async function crearActivoAccion(datos: GuardarActivoInput) {
  return guardarActivo(datos, crearActivoServidor);
}

export async function actualizarActivoAccion(activoId: number, datos: GuardarActivoInput) {
  const estado = (datos as { estado?: unknown } | null)?.estado;
  if (!esEstadoValido(estado)) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL } satisfies ResultadoGuardar<Activo>;
  return guardarActivo(datos, (activo) => actualizarActivoServidor(activoId, { ...activo, estado }));
}

export async function cambiarEstadoActivoAccion(activoId: number, estado: EstadoActivo): Promise<ResultadoCambiarEstado> {
  return ejecutarCambioEstado(
    activoId,
    estado,
    cambiarEstadoActivoServidor,
    () => revalidatePath("/activos", "layout"),
    {
      baja: "No se pudo dar de baja al activo seleccionado.",
      reactivacion: "No se pudo reactivar el activo seleccionado.",
    },
  );
}
