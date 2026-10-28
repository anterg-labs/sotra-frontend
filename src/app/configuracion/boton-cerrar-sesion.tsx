"use client";

import { useState } from "react";
import { IconoSalir } from "@/componentes/iconos";
import { cerrarSesion } from "@/servicios/servicio-sesion";

export function BotonCerrarSesion() {
  const [estaCerrando, setEstaCerrando] = useState(false);
  const [hayError, setHayError] = useState(false);

  async function salir() {
    if (estaCerrando) return;
    setEstaCerrando(true);
    setHayError(false);
    try {
      await cerrarSesion();
    } catch {
      setHayError(true);
      setEstaCerrando(false);
    }
  }

  return <>
    <button className="opcion-configuracion opcion-configuracion-boton" disabled={estaCerrando} onClick={salir} type="button">
      <span aria-hidden="true" className="opcion-configuracion-icono"><IconoSalir /></span>
      <span><strong>{estaCerrando ? "Cerrando sesión…" : "Cerrar sesión"}</strong><small>Salir de tu cuenta en este dispositivo.</small></span>
    </button>
    {hayError ? <p className="form-error-banner" role="alert">No se pudo cerrar la sesión. Intentá de nuevo.</p> : null}
  </>;
}
