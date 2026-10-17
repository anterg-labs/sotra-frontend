"use client";

import { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";

/** El estado pertenece al enlace de Next: termina o se cancela junto con la navegación real. */
export function IndicadorNavegacion({ destino }: { destino: string }) {
  const { pending: estaNavegando } = useLinkStatus();
  if (!estaNavegando) return null;

  return createPortal(
    <div className="navegacion-pendiente" role="status" aria-live="polite">
      <span aria-hidden="true" className="indicador-carga" />
      <span>Abriendo {destino}…</span>
    </div>,
    document.body,
  );
}
