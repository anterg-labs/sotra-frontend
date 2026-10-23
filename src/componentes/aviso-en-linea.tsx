"use client";

import { useState, type Ref } from "react";

/**
 * Aviso fijo dentro de un formulario o de una pantalla (no es un toast): se queda donde está, con el estilo de error,
 * y se puede cerrar con la cruz. Si el mensaje cambia, vuelve a mostrarse. Recibe el `ref` para que el formulario
 * le dé el foco al fallar el envío.
 */
export function AvisoEnLinea(props: { children: string; ref?: Ref<HTMLDivElement> }) {
  const { children, ref } = props;
  const [cerrado, setCerrado] = useState<string | null>(null);
  if (cerrado === children) return null;

  return (
    <div className="form-error-banner aviso-en-linea" ref={ref} role="alert" tabIndex={-1}>
      {children}
      <button aria-label="Cerrar aviso" className="aviso-cerrar" onClick={() => setCerrado(children)} type="button">
        ✕
      </button>
    </div>
  );
}
