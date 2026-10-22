"use client";

import Image from "next/image";
import { useState } from "react";
import { cerrarSesion } from "@/servicios/servicio-sesion";

type PropiedadesPantallaSinAcceso = {
  /** `sin-acceso`: existe en Keycloak pero no en SOTRA o no tiene roles. `error`: no se pudo consultar la sesión. */
  motivo: "sin-acceso" | "error";
  correo?: string;
};

/** Reemplaza toda la aplicación: sin acceso solo se puede cerrar la sesión (o reintentar, si fue un error). */
export function PantallaSinAcceso(props: PropiedadesPantallaSinAcceso) {
  const [estaCerrando, setEstaCerrando] = useState(false);
  const [hayError, setHayError] = useState(false);

  async function salir() {
    setEstaCerrando(true);
    setHayError(false);
    try {
      await cerrarSesion();
    } catch {
      setHayError(true);
      setEstaCerrando(false);
    }
  }

  return (
    <main className="page-content">
      <section aria-labelledby="titulo-sin-acceso" className="panel pagina-estado" role="alert">
        <Image alt="CVM" className="h-auto w-20" height={152} priority src="/images/logo-cvm.png" width={717} />
        {props.motivo === "sin-acceso" ? (
          <>
            <p className="eyebrow">Sin acceso</p>
            <h1 id="titulo-sin-acceso">Tu usuario no tiene acceso a SOTRA. Contactá al administrador.</h1>
            {props.correo ? <p>{"Iniciaste sesión como " + props.correo + "."}</p> : null}
          </>
        ) : (
          <>
            <p className="eyebrow">Sesión</p>
            <h1 id="titulo-sin-acceso">No pudimos obtener los datos de tu sesión.</h1>
            <p>Revisá tu conexión e intentá de nuevo en unos minutos.</p>
          </>
        )}
        <div className="flex flex-wrap gap-3">
          {props.motivo === "error" ? (
            <button className="secondary-button" onClick={() => window.location.reload()} type="button">
              Reintentar
            </button>
          ) : null}
          <button className="primary-button" disabled={estaCerrando} onClick={salir} type="button">
            {estaCerrando ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
        {hayError ? <p className="form-error-banner">No se pudo cerrar la sesión. Intentá nuevamente.</p> : null}
      </section>
    </main>
  );
}
