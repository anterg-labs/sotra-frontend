"use client";

import Link from "next/link";

type PropiedadesPaginaError = {
  reset: () => void;
};

/** Pantalla de error inesperado: no muestra detalles técnicos y ofrece reintentar o volver al inicio. */
export default function PaginaError({ reset }: PropiedadesPaginaError) {
  return (
    <main className="page-content">
      <section className="panel pagina-estado" role="alert">
        <p className="eyebrow">Algo salió mal</p>
        <h1>No pudimos mostrar esta pantalla</h1>
        <p>Ocurrió un problema inesperado. Podés intentarlo de nuevo o volver al inicio.</p>
        <div className="flex flex-wrap gap-3">
          <button className="primary-button" onClick={reset} type="button">
            Reintentar
          </button>
          <Link className="secondary-button" href="/">
            Ir al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
