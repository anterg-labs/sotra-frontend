"use server";

import { revalidatePath } from "next/cache";
import {
  actualizarDocumentoTecnicoServidor,
  cambiarVigenciaDocumentoTecnicoServidor,
  eliminarDocumentoTecnicoServidor,
  reprocesarDocumentoTecnicoServidor,
} from "@/servicios/servidor/documentos-tecnicos";
import { esIdValido, resultadoFallido } from "@/servicios/servidor/resultado-accion";
import {
  esTipoDocumento,
  LARGO_MAXIMO_DESCRIPCION_DOCUMENTO,
  LARGO_MAXIMO_TITULO_DOCUMENTO,
  type ActualizarDocumentoTecnicoInput,
  type DocumentoTecnico,
} from "@/tipos/documento-tecnico";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";

export async function eliminarDocumentoTecnicoAccion(documentoId: number): Promise<ResultadoCambiarEstado> {
  const mensaje = "No se pudo eliminar el documento seleccionado.";
  if (!esIdValido(documentoId)) return { exito: false, mensaje };

  try {
    await eliminarDocumentoTecnicoServidor(documentoId);
    revalidatePath("/documentacion-tecnica", "layout");
    return { exito: true };
  } catch {
    return { exito: false, mensaje };
  }
}

export async function cambiarVigenciaDocumentoAccion(documentoId: number, vigente: boolean): Promise<ResultadoCambiarEstado> {
  const mensaje = "No se pudo cambiar la vigencia del documento.";
  if (!esIdValido(documentoId) || typeof vigente !== "boolean") return { exito: false, mensaje };

  try {
    await cambiarVigenciaDocumentoTecnicoServidor(documentoId, vigente);
    revalidatePath("/documentacion-tecnica", "layout");
    return { exito: true };
  } catch {
    return { exito: false, mensaje };
  }
}

/** Vuelve a poner el documento en la cola de procesamiento, por ejemplo después de un error. */
export async function reprocesarDocumentoAccion(documentoId: number): Promise<ResultadoCambiarEstado> {
  const mensaje = "No se pudo volver a procesar el documento.";
  if (!esIdValido(documentoId)) return { exito: false, mensaje };

  try {
    await reprocesarDocumentoTecnicoServidor(documentoId);
    revalidatePath("/documentacion-tecnica", "layout");
    return { exito: true };
  } catch (excepcion) {
    return { exito: false, mensaje: excepcion instanceof Error && excepcion.message ? excepcion.message : mensaje };
  }
}

const MENSAJE_EDICION = "No se pudo guardar el documento.";
const campoPorCodigo = {
  TITULO_DEMASIADO_LARGO: "titulo",
  DESCRIPCION_DEMASIADO_LARGA: "descripcion",
  TIPO_DOCUMENTO_INVALIDO: "tipo",
  MODELO_NO_EXISTE: "modeloMaquinaId",
  ACTIVO_NO_EXISTE: "activoId",
};

function esIdOpcional(valor: unknown): valor is number | null {
  return valor === null || esIdValido(valor);
}

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
export async function actualizarDocumentoAccion(
  documentoId: number,
  datos: ActualizarDocumentoTecnicoInput,
): Promise<ResultadoGuardar<DocumentoTecnico>> {
  const entrada = datos as unknown as Record<string, unknown> | null;
  const { titulo, tipo, descripcion, activoId, modeloMaquinaId } = entrada ?? {};
  if (
    !esIdValido(documentoId) ||
    !(titulo === null || typeof titulo === "string") ||
    !(descripcion === null || typeof descripcion === "string") ||
    typeof tipo !== "string" ||
    !esTipoDocumento(tipo) ||
    !esIdOpcional(activoId) ||
    !esIdOpcional(modeloMaquinaId)
  ) {
    return { exito: false, errores: {}, mensaje: MENSAJE_EDICION };
  }

  const errores: Record<string, string> = {};
  if ((titulo?.trim().length ?? 0) > LARGO_MAXIMO_TITULO_DOCUMENTO) {
    errores.titulo = `El título no puede superar ${LARGO_MAXIMO_TITULO_DOCUMENTO} caracteres.`;
  }
  if ((descripcion?.trim().length ?? 0) > LARGO_MAXIMO_DESCRIPCION_DOCUMENTO) {
    errores.descripcion = `La descripción no puede superar ${LARGO_MAXIMO_DESCRIPCION_DOCUMENTO} caracteres.`;
  }
  if (Object.keys(errores).length > 0) return { exito: false, errores, mensaje: "" };

  try {
    const registro = await actualizarDocumentoTecnicoServidor(documentoId, {
      titulo: titulo?.trim() || null,
      tipo,
      descripcion: descripcion?.trim() || null,
      activoId,
      modeloMaquinaId,
    });
    revalidatePath("/documentacion-tecnica", "layout");
    return { exito: true, registro };
  } catch (excepcion) {
    return resultadoFallido(excepcion, campoPorCodigo, MENSAJE_EDICION);
  }
}
