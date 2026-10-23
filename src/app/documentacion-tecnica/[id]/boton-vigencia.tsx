"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cambiarVigenciaDocumentoAccion } from "../acciones";

/** Alterna un documento entre vigente y obsoleto; la IA solo usa los vigentes. */
export function BotonVigencia(props: { documentoId: number; vigente: boolean }) {
  const enrutador = useRouter();
  const [error, setError] = useState("");
  const [estaPendiente, iniciarTransicion] = useTransition();

  function alternar() {
    setError("");
    iniciarTransicion(async () => {
      const resultado = await cambiarVigenciaDocumentoAccion(props.documentoId, !props.vigente);
      if (resultado.exito) enrutador.refresh();
      else setError(resultado.mensaje);
    });
  }

  return (
    <>
      <button className="secondary-button" disabled={estaPendiente} onClick={alternar} type="button">
        {estaPendiente ? "Guardando…" : props.vigente ? "Marcar como obsoleto" : "Marcar como vigente"}
      </button>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </>
  );
}
