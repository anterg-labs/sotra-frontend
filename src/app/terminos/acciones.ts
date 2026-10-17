"use server";

import { revalidatePath } from "next/cache";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { esIdValido, resultadoFallido } from "@/servicios/servidor/resultado-accion";
import { aceptarTerminosServidor, obtenerTerminosVigentesServidor } from "@/servicios/servidor/terminos";
import type { EstadoTerminos, ResultadoTerminosVigentes } from "@/tipos/terminos";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";

const MENSAJE_GENERAL = "No se pudo registrar la aceptación de los términos y condiciones.";
const MENSAJE_OBLIGATORIA = "Para continuar debés aceptar los términos y condiciones.";
const MENSAJE_DESACTUALIZADOS =
  "Los términos y condiciones cambiaron mientras los leías. Consultá la versión vigente y volvé a aceptar.";

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
export async function aceptarTerminosAccion(
  usuarioId: number,
  terminosId: number,
  acepta: boolean,
  version: number,
): Promise<ResultadoGuardar<EstadoTerminos>> {
  if (!esIdValido(usuarioId) || !esIdValido(terminosId) || !esIdValido(version)) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };
  if (acepta !== true) return { exito: false, errores: { aceptacion: MENSAJE_OBLIGATORIA }, mensaje: "" };

  try {
    const estado = await aceptarTerminosServidor({ usuarioId, terminosId, version, acepta });
    revalidatePath("/usuarios", "layout");
    return { exito: true, registro: estado };
  } catch (error) {
    if (error instanceof ErrorDeApi && error.codigo === "TERMINOS_DESACTUALIZADOS") {
      return { exito: false, errores: {}, mensaje: MENSAJE_DESACTUALIZADOS };
    }
    return resultadoFallido(error, { ACEPTACION_OBLIGATORIA: "aceptacion" }, MENSAJE_GENERAL);
  }
}

/** Texto vigente para el modal del pie: sin versión publicada (404) es «vacío»; cualquier otro fallo, «error». Nunca lanza. */
export async function obtenerTerminosVigentesAccion(): Promise<ResultadoTerminosVigentes> {
  try {
    return { estado: "listo", terminos: await obtenerTerminosVigentesServidor() };
  } catch (error) {
    if (error instanceof ErrorDeApi && error.estadoHttp === 404) return { estado: "vacio" };
    return { estado: "error" };
  }
}
