"use server";

import { revalidatePath } from "next/cache";
import { resultadoFallido } from "@/servicios/servidor/resultado-accion";
import { publicarTerminosServidor } from "@/servicios/servidor/terminos";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { PublicarTerminosInput, TerminosCondiciones } from "@/tipos/terminos";
import { validarTerminos } from "@/validaciones/terminos";

const MENSAJE_GENERAL = "No se pudieron guardar los términos y condiciones.";

export async function publicarTerminosAccion(datos: PublicarTerminosInput): Promise<ResultadoGuardar<TerminosCondiciones>> {
  if (typeof datos !== "object" || datos === null || typeof datos.texto !== "string") {
    return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };
  }
  const errores = validarTerminos(datos);
  if (Object.keys(errores).length > 0) return { exito: false, errores, mensaje: "" };
  try {
    const registro = await publicarTerminosServidor({ texto: datos.texto });
    revalidatePath("/configuracion/terminos");
    revalidatePath("/usuarios", "layout");
    return { exito: true, registro };
  } catch (error) {
    return resultadoFallido(error, {}, MENSAJE_GENERAL);
  }
}
