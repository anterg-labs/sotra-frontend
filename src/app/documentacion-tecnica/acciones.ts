"use server";

import { revalidatePath } from "next/cache";
import { eliminarDocumentoTecnicoServidor } from "@/servicios/servidor/documentos-tecnicos";
import { esIdValido } from "@/servicios/servidor/resultado-accion";
import type { ResultadoCambiarEstado } from "@/tipos/resultado-accion";

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
