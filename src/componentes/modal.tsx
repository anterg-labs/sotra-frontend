"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DialogoDescartarCambios } from "@/componentes/dialogo-descartar-cambios";

type PropiedadesModal = {
  titulo: string;
  estaAbierto: boolean;
  alCerrar: () => void;
  /** Evita cerrar mientras se guarda, para no perder un envío en curso. */
  estaOcupado?: boolean;
  /** Modal bloqueante: sin ✕, sin Esc y sin cerrar al hacer clic afuera. Solo se va cuando la pantalla deja de abrirlo. */
  obligatorio?: boolean;
  children: React.ReactNode;
};

/**
 * Modal centrado sobre el elemento nativo `<dialog>`: el navegador atrapa el foco, lo devuelve al botón
 * que lo abrió y cierra con Esc. Si la persona escribió algo, pide confirmar antes de descartarlo.
 * En pantallas chicas ocupa toda la pantalla.
 */
export function Modal(props: PropiedadesModal) {
  const { titulo, estaAbierto, alCerrar, estaOcupado = false, obligatorio = false, children } = props;
  const referencia = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const seEscribio = useRef(false);
  const [estaConfirmandoDescarte, setEstaConfirmandoDescarte] = useState(false);

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;

    if (estaAbierto && !dialogo.open) {
      seEscribio.current = false;
      dialogo.showModal();
    } else if (!estaAbierto && dialogo.open) {
      dialogo.close();
    }
  }, [estaAbierto]);

  useEffect(() => {
    if (!estaAbierto) return;
    const desbordeAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = desbordeAnterior;
    };
  }, [estaAbierto]);

  function solicitarCierre() {
    if (estaOcupado || obligatorio) return;
    if (seEscribio.current) {
      setEstaConfirmandoDescarte(true);
      return;
    }
    alCerrar();
  }

  function cerrarConEscape(evento: React.SyntheticEvent<HTMLDialogElement>) {
    evento.preventDefault();
    solicitarCierre();
  }

  // Esc dos veces seguidas sin interacción puede cerrar el <dialog> sin que se pueda cancelar: si es obligatorio, se vuelve a abrir.
  function reabrirSiEsObligatorio() {
    const dialogo = referencia.current;
    if (obligatorio && estaAbierto && dialogo && !dialogo.open) dialogo.showModal();
    if (dialogo && !dialogo.open) setEstaConfirmandoDescarte(false);
  }

  function cerrarAlHacerClicFuera(evento: React.MouseEvent<HTMLDialogElement>) {
    if (evento.target === referencia.current) {
      solicitarCierre();
    }
  }

  return (
    <dialog
      aria-labelledby={idTitulo}
      className="modal-dialogo"
      onCancel={cerrarConEscape}
      onClick={cerrarAlHacerClicFuera}
      onClose={reabrirSiEsObligatorio}
      ref={referencia}
    >
      <div className="modal-dialogo-cabecera">
        <h2 id={idTitulo}>{titulo}</h2>
        {obligatorio ? null : (
          <button
            aria-label="Cerrar"
            className="boton-icono"
            disabled={estaOcupado}
            onClick={solicitarCierre}
            type="button"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>
      <div className="modal-dialogo-cuerpo" onInput={() => { seEscribio.current = true; }}>{estaAbierto ? children : null}</div>
      {estaAbierto && estaConfirmandoDescarte ? (
        <DialogoDescartarCambios
          alContinuar={() => setEstaConfirmandoDescarte(false)}
          alDescartar={() => {
            if (estaOcupado || obligatorio) return;
            setEstaConfirmandoDescarte(false);
            seEscribio.current = false;
            alCerrar();
          }}
        />
      ) : null}
    </dialog>
  );
}
