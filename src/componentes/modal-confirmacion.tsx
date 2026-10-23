"use client";

import { useId } from "react";

type ModalConfirmacionProps = {
  titulo: string;
  descripcion: string;
  etiquetaConfirmar: string;
  etiquetaCancelar?: string;
  estaConfirmando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function ModalConfirmacion(props: ModalConfirmacionProps) {
  const idTitulo = useId();
  const titulo = props.titulo;
  const descripcion = props.descripcion;
  const etiquetaConfirmar = props.etiquetaConfirmar;
  let etiquetaCancelar = props.etiquetaCancelar;
  if (!etiquetaCancelar) {
    etiquetaCancelar = "Cancelar";
  }
  let estaConfirmando = props.estaConfirmando;
  if (estaConfirmando === undefined) {
    estaConfirmando = false;
  }
  const onConfirmar = props.onConfirmar;
  const onCancelar = props.onCancelar;

  function detenerPropagacion(evento: React.MouseEvent<HTMLDivElement>) {
    evento.stopPropagation();
  }

  let textoBotonConfirmar = etiquetaConfirmar;
  if (estaConfirmando) {
    textoBotonConfirmar = "Procesando…";
  }

  return (
    <div className="modal-overlay" onClick={onCancelar} role="presentation">
      <div
        aria-labelledby={idTitulo}
        aria-modal="true"
        className="modal-panel"
        onClick={detenerPropagacion}
        role="dialog"
      >
        <h2 id={idTitulo}>{titulo}</h2>
        <p>{descripcion}</p>
        <div className="form-actions">
          <button className="secondary-button" disabled={estaConfirmando} onClick={onCancelar} type="button">
            {etiquetaCancelar}
          </button>
          <button className="danger-button" disabled={estaConfirmando} onClick={onConfirmar} type="button">
            {textoBotonConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
