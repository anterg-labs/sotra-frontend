"use client";

import type { Ref } from "react";
import type { TerminosCondiciones } from "@/tipos/terminos";
import { TextoMarkdown } from "./texto-markdown";

/** En pantallas chicas el modal ocupa toda la pantalla y es el cuerpo el que se desplaza: un segundo recuadro con scroll propio se vuelve difícil de recorrer con el dedo. */
export function DocumentoTerminos({ documento, ref, centinelaFinal }: {
  documento: Pick<TerminosCondiciones, "texto">;
  ref?: Ref<HTMLDivElement>;
  centinelaFinal?: Ref<HTMLSpanElement>;
}) {
  return (
    <div aria-label="Texto de los términos y condiciones" className="min-[761px]:max-h-[50dvh] min-[761px]:overflow-y-auto" ref={ref} role="region" tabIndex={0}>
      <TextoMarkdown texto={documento.texto} />
      <span aria-hidden="true" className="block h-px" ref={centinelaFinal} />
    </div>
  );
}
