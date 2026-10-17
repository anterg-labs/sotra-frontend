"use server";

import { revalidatePath } from "next/cache";
import {
  actualizarModeloMaquinaServidor,
  cambiarEstadoModeloMaquinaServidor,
  crearModeloMaquinaServidor,
} from "@/servicios/servidor/modelos-maquina";
import { ejecutarCambioEstado, esEstadoValido, esIdValido, resultadoFallido, textoOpcional } from "@/servicios/servidor/resultado-accion";
import type { CrearModeloMaquinaInput, EstadoModeloMaquina, GuardarModeloMaquinaInput, ModeloMaquina } from "@/tipos/modelo-maquina";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";
import { validarNombreCatalogo, validarTipoMaquinaSeleccionado } from "@/validaciones/maquinaria";

const MENSAJE_GENERAL = "No se pudo guardar el modelo de máquina.";
const campoPorCodigoDuplicado = { MODELO_DUPLICADO: "nombre" };

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
function leerEntrada(datos: unknown): CrearModeloMaquinaInput | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { nombre, tipoMaquinaId, descripcion } = datos as Record<string, unknown>;
  const descripcionLimpia = textoOpcional(descripcion);
  if (typeof nombre !== "string" || typeof tipoMaquinaId !== "number" || descripcionLimpia === undefined) return null;
  return { nombre, tipoMaquinaId, descripcion: descripcionLimpia };
}

async function guardarModelo(
  datos: unknown,
  guardar: (modelo: CrearModeloMaquinaInput) => Promise<ModeloMaquina>,
): Promise<ResultadoGuardar<ModeloMaquina>> {
  const entrada = leerEntrada(datos);
  if (!entrada) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };

  const errorNombre = validarNombreCatalogo(entrada.nombre);
  const errorTipo = validarTipoMaquinaSeleccionado(esIdValido(entrada.tipoMaquinaId) ? String(entrada.tipoMaquinaId) : "");
  if (errorNombre || errorTipo) {
    return {
      exito: false,
      errores: { ...(errorNombre ? { nombre: errorNombre } : {}), ...(errorTipo ? { tipoMaquinaId: errorTipo } : {}) },
      mensaje: "",
    };
  }

  try {
    const registro = await guardar(entrada);
    revalidatePath("/activos", "layout");
    return { exito: true, registro };
  } catch (error) {
    return resultadoFallido(error, campoPorCodigoDuplicado, MENSAJE_GENERAL);
  }
}

export async function crearModeloMaquinaAccion(datos: GuardarModeloMaquinaInput) {
  return guardarModelo(datos, crearModeloMaquinaServidor);
}

export async function actualizarModeloMaquinaAccion(modeloMaquinaId: number, datos: GuardarModeloMaquinaInput) {
  const estado = (datos as { estado?: unknown } | null)?.estado;
  if (!esEstadoValido(estado)) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL } satisfies ResultadoGuardar<ModeloMaquina>;
  return guardarModelo(datos, (modelo) => actualizarModeloMaquinaServidor(modeloMaquinaId, { ...modelo, estado }));
}

export async function cambiarEstadoModeloMaquinaAccion(
  modeloMaquinaId: number,
  estado: EstadoModeloMaquina,
): Promise<ResultadoCambiarEstado> {
  return ejecutarCambioEstado(
    modeloMaquinaId,
    estado,
    cambiarEstadoModeloMaquinaServidor,
    () => revalidatePath("/activos", "layout"),
    {
      baja: "No se pudo dar de baja el modelo de máquina seleccionado.",
      reactivacion: "No se pudo reactivar el modelo de máquina seleccionado.",
    },
  );
}
