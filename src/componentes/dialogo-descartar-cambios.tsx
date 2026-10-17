"use client";

import { useEffect, useId, useRef } from "react";

type DialogoDescartarCambiosProps = {
  alContinuar: () => void;
  alDescartar: () => void;
};

export function DialogoDescartarCambios({ alContinuar, alDescartar }: DialogoDescartarCambiosProps) {
  const referencia = useRef<HTMLDialogElement>(null);
  const referenciaContinuar = useRef<HTMLButtonElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;
    const focoAnterior = document.activeElement;
    dialogo.showModal();
    referenciaContinuar.current?.focus();
    return () => {
      dialogo.close();
      requestAnimationFrame(() => {
        if (focoAnterior instanceof HTMLElement && focoAnterior.isConnected && focoAnterior.closest("dialog")?.open) focoAnterior.focus();
      });
    };
  }, []);

  return (
    <dialog
      aria-describedby={idDescripcion}
      aria-labelledby={idTitulo}
      className="dialogo-descartar"
      onCancel={(evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        alContinuar();
      }}
      onClick={(evento) => {
        evento.stopPropagation();
        if (evento.target === evento.currentTarget) alContinuar();
      }}
      ref={referencia}
      role="alertdialog"
    >
      <div className="dialogo-descartar-contenido">
        <span aria-hidden="true" className="dialogo-descartar-icono">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 8v5m0 3v.01" /><circle cx="12" cy="12" r="9" /></svg>
        </span>
        <h2 id={idTitulo}>¿Descartar los cambios?</h2>
        <p id={idDescripcion}>Tienes datos sin guardar. Si cierras este formulario, perderás los cambios.</p>
      </div>
      <div className="dialogo-descartar-acciones">
        <button className="secondary-button" onClick={alContinuar} ref={referenciaContinuar} type="button">Seguir editando</button>
        <button className="danger-button" onClick={alDescartar} type="button">Descartar cambios</button>
      </div>
    </dialog>
  );
}
