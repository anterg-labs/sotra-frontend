"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

type PropiedadesSeccion = {
  /** Identificador estable: va en la dirección (`#id`) y en la lista de secciones abiertas de la URL. */
  id: string;
  titulo: string;
  /** Una frase que resume qué hay adentro, visible aun con la sección cerrada. */
  resumen: string;
  abiertaInicial?: boolean;
  children: ReactNode;
};

const PARAMETRO_ABIERTAS = "abiertas";

function leerAbiertas() {
  return (new URLSearchParams(window.location.search).get(PARAMETRO_ABIERTAS) ?? "").split(",").filter(Boolean);
}

/**
 * Sección que se abre y se cierra a pedido. El contenido se monta la primera vez que se abre (así sus pedidos a la API
 * solo ocurren si la persona lo quiere ver), y las secciones abiertas viajan en la URL para poder compartirlas.
 */
export function SeccionPlegable({ id, titulo, resumen, abiertaInicial = false, children }: PropiedadesSeccion) {
  const [abierta, setAbierta] = useState(abiertaInicial);
  const [montada, setMontada] = useState(abiertaInicial);
  const idCuerpo = useId();

  useEffect(() => {
    function abrirSiCorresponde() {
      if (window.location.hash === "#seccion-" + id || leerAbiertas().includes(id)) {
        setAbierta(true);
        setMontada(true);
      }
    }
    abrirSiCorresponde();
    window.addEventListener("hashchange", abrirSiCorresponde);
    return () => window.removeEventListener("hashchange", abrirSiCorresponde);
  }, [id]);

  function alternar() {
    const siguiente = !abierta;
    setAbierta(siguiente);
    if (siguiente) setMontada(true);

    const direccion = new URL(window.location.href);
    const abiertas = new Set(leerAbiertas());
    if (siguiente) abiertas.add(id);
    else abiertas.delete(id);
    if (abiertas.size > 0) direccion.searchParams.set(PARAMETRO_ABIERTAS, [...abiertas].join(","));
    else direccion.searchParams.delete(PARAMETRO_ABIERTAS);
    window.history.replaceState(window.history.state, "", direccion);
  }

  return (
    <section aria-labelledby={idCuerpo + "-titulo"} className="seccion-plegable" id={"seccion-" + id}>
      <button aria-controls={idCuerpo} aria-expanded={abierta} className="seccion-plegable-cabecera" onClick={alternar} type="button">
        <span>
          <h2 id={idCuerpo + "-titulo"}>{titulo}</h2>
          <p>{resumen}</p>
        </span>
        <svg aria-hidden="true" className="seccion-plegable-flecha" fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="seccion-plegable-cuerpo" hidden={!abierta} id={idCuerpo}>
        {montada ? children : null}
      </div>
    </section>
  );
}
