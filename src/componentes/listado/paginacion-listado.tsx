"use client";

import { useNavegacionListado } from "./navegacion-listado";
import { construirUrlListado } from "./url-listado";

type PropiedadesPaginacion = {
  ruta: string;
  filtros: Record<string, string | undefined>;
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
  /** Plural del elemento listado, por ejemplo «clientes». */
  plural: string;
};

export function PaginacionListado(props: PropiedadesPaginacion) {
  const { ruta, filtros, pagina, totalPaginas, totalElementos, plural } = props;
  const { estaPendiente, navegar } = useNavegacionListado();

  if (totalPaginas <= 1) return null;

  function irA(numeroPagina: number) {
    navegar(construirUrlListado(ruta, { ...filtros, pagina: numeroPagina }));
  }

  return (
    <div aria-busy={estaPendiente} className="pagination">
      <button disabled={pagina <= 1 || estaPendiente} onClick={() => irA(pagina - 1)} type="button">
        Anterior
      </button>
      <span>{"Página " + pagina + " de " + totalPaginas + " (" + totalElementos + " " + plural + ")"}</span>
      <button disabled={pagina >= totalPaginas || estaPendiente} onClick={() => irA(pagina + 1)} type="button">
        Siguiente
      </button>
    </div>
  );
}
