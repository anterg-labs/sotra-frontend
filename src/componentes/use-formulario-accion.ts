"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";

type Opciones<Datos, Registro> = {
  /** Validación en línea en el navegador; devuelve errores por id de campo (vacío si es válido). */
  validar: (datos: Datos) => Record<string, string | undefined>;
  /** Server Action que guarda. */
  accion: (datos: Datos) => Promise<ResultadoGuardar<Registro>>;
  alExito: (registro: Registro) => void;
  mensajeGeneral: string;
  /** Traduce el nombre del error al id del elemento a enfocar, si difieren. */
  idCampo?: (campo: string) => string;
};

/**
 * Formulario con `useActionState`: valida en el navegador, llama a la Server Action solo si pasa,
 * lleva el foco al primer campo con error (o al mensaje general) y avisa al terminar con éxito.
 */
export function useFormularioAccion<Datos, Registro>(opciones: Opciones<Datos, Registro>) {
  const { validar, accion, alExito, mensajeGeneral, idCampo } = opciones;
  const referenciaErrorGeneral = useRef<HTMLParagraphElement>(null);

  const [resultado, enviarAccion, estaEnviando] = useActionState(
    async (_previo: ResultadoGuardar<Registro> | null, datos: Datos): Promise<ResultadoGuardar<Registro>> => {
      const errores = Object.fromEntries(
        Object.entries(validar(datos)).filter((entrada): entrada is [string, string] => Boolean(entrada[1])),
      );
      if (Object.keys(errores).length > 0) return { exito: false, errores, mensaje: "" };

      let respuesta: ResultadoGuardar<Registro>;
      try {
        respuesta = await accion(datos);
      } catch {
        return { exito: false, errores: {}, mensaje: mensajeGeneral };
      }

      if (respuesta.exito) alExito(respuesta.registro);
      return respuesta;
    },
    null,
  );

  const errores: Record<string, string | undefined> = resultado && !resultado.exito ? resultado.errores : {};
  const errorGeneral = resultado && !resultado.exito ? resultado.mensaje : "";

  useEffect(() => {
    if (!resultado || resultado.exito) return;
    const primerCampo = Object.keys(resultado.errores)[0];
    if (primerCampo) {
      document.getElementById(idCampo ? idCampo(primerCampo) : primerCampo)?.focus();
    } else if (resultado.mensaje) {
      referenciaErrorGeneral.current?.focus();
    }
  }, [resultado, idCampo]);

  function enviar(datos: Datos) {
    startTransition(() => enviarAccion(datos));
  }

  return { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral };
}
