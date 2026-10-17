"use client";

import type { Ref } from "react";
import type { TerminosCondiciones } from "@/tipos/terminos";
import { TextoMarkdown } from "./texto-markdown";

export function DocumentoTerminos({ documento, ref }: {
  documento: Pick<TerminosCondiciones, "texto">;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div aria-label="Texto de los términos y condiciones" className="max-h-[50dvh] overflow-y-auto" ref={ref} role="region" tabIndex={0}>
      <TextoMarkdown texto={documento.texto} />
    </div>
  );
}
