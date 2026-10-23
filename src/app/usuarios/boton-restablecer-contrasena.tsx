"use client";

import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { restablecerContrasenaAccion } from "./acciones";

type PropiedadesBotonRestablecer = { usuarioId: number; correo: string };

/** Reenvía el correo de Keycloak para elegir una contraseña nueva, después de confirmar. */
export function BotonRestablecerContrasena(props: PropiedadesBotonRestablecer) {
  const { mostrarAviso } = useAvisos();
  const [estaConfirmando, setEstaConfirmando] = useState(false);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [error, setError] = useState("");

  async function restablecer() {
    setEstaEnviando(true);
    setError("");
    try {
      const resultado = await restablecerContrasenaAccion(props.usuarioId);
      if (resultado.exito) {
        mostrarAviso("exito", "Se envió un correo a " + props.correo + " para que elija una contraseña nueva.");
      } else {
        setError(resultado.mensaje);
      }
    } catch {
      setError("No se pudo enviar el correo para restablecer la contraseña.");
    } finally {
      setEstaEnviando(false);
      setEstaConfirmando(false);
    }
  }

  return (
    <>
      <button className="secondary-button" disabled={estaEnviando} onClick={() => setEstaConfirmando(true)} type="button">
        Restablecer contraseña
      </button>
      {error ? <p className="form-error-banner" role="alert">{error}</p> : null}
      {estaConfirmando ? (
        <ModalConfirmacion
          descripcion={"Se le enviará a " + props.correo + " un correo para elegir una contraseña nueva."}
          estaConfirmando={estaEnviando}
          etiquetaConfirmar="Enviar correo"
          onCancelar={() => setEstaConfirmando(false)}
          onConfirmar={restablecer}
          titulo="Restablecer contraseña"
        />
      ) : null}
    </>
  );
}
