"use client";

import { useId, useState } from "react";
import { IconoFiltrosAvanzados } from "@/componentes/iconos";

type PropiedadesFiltrosAvanzados = {
  /** Hay algún filtro aplicado además de la búsqueda: el panel arranca abierto y el botón lo señala con un punto. */
  hayFiltros: boolean;
  alLimpiar: () => void;
  children: React.ReactNode;
};

const CAMPOS_QUE_NO_SON_FILTROS = ["buscar", "ordenarPor", "direccionOrden", "pagina"];

/** Indica si los valores de una barra tienen algún filtro aplicado (sin contar la búsqueda ni el orden); `porDefecto` fija los valores que no cuentan como filtro. */
export function hayFiltrosAplicados(valores: object, porDefecto: Record<string, unknown> = {}) {
  return Object.entries(valores).some(([nombre, valor]) => {
    if (CAMPOS_QUE_NO_SON_FILTROS.includes(nombre)) return false;
    if (nombre in porDefecto) return valor !== porDefecto[nombre];
    return valor !== "" && valor !== false && valor !== undefined;
  });
}

/**
 * Deja a la vista solo el buscador: el resto de los filtros queda detrás de un botón discreto («Filtros avanzados»),
 * junto con «Limpiar filtros». Va dentro de la barra de filtros, a continuación del buscador.
 */
export function FiltrosAvanzados(props: PropiedadesFiltrosAvanzados) {
  const id = useId();
  const [estaAbierto, setEstaAbierto] = useState(props.hayFiltros);

  return (
    <>
      <div className="barra-filtros-acciones">
        <button
          aria-controls={id}
          aria-expanded={estaAbierto}
          className="boton-filtros-avanzados"
          data-activo={props.hayFiltros}
          onClick={() => setEstaAbierto((abierto) => !abierto)}
          title="Filtros avanzados"
          type="button"
        >
          <IconoFiltrosAvanzados />
          <span className="sr-only">Filtros avanzados</span>
        </button>
      </div>
      {estaAbierto ? (
        <fieldset className="filtros-avanzados" id={id}>
          <legend>Filtros avanzados</legend>
          {props.children}
          <div className="barra-filtros-acciones">
            <button className="secondary-button" onClick={props.alLimpiar} type="button">
              Limpiar filtros
            </button>
          </div>
        </fieldset>
      ) : null}
    </>
  );
}
