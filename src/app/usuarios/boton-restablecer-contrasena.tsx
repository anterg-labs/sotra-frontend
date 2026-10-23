"use client";

import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { restablecerContrasenaAccion } from "./acciones";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

type PropiedadesBotonRestablecer = { usuarioId: number; correo: string };

/** Reenvía al correo de la persona el enlace de Keycloak para modificar su contraseña, después de confirmar. */
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
        mostrarAviso("exito", "Se envió el enlace a " + props.correo + " para que modifique su contraseña.");
      } else {
        setError(resultado.mensaje);
      }
    } catch {
      setError("No se pudo enviar el enlace para modificar la contraseña.");
    } finally {
      setEstaEnviando(false);
      setEstaConfirmando(false);
    }
  }

  return (
    <>
      <button className="secondary-button" disabled={estaEnviando} onClick={() => setEstaConfirmando(true)} type="button">
        Reenviar enlace de contraseña
      </button>
      {error ? <AvisoEnLinea>{error}</AvisoEnLinea> : null}
      {estaConfirmando ? (
        <ModalConfirmacion
          descripcion={"Se le enviará a " + props.correo + " un correo con un enlace para modificar su contraseña de acceso."}
          estaConfirmando={estaEnviando}
          etiquetaConfirmar="Enviar enlace"
          onCancelar={() => setEstaConfirmando(false)}
          onConfirmar={restablecer}
          titulo="Reenviar enlace de contraseña"
        />
      ) : null}
    </>
  );
}
