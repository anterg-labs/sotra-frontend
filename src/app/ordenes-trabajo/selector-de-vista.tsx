import Link from "next/link";
import type { FiltrosOrdenesTrabajo } from "@/tipos/orden-trabajo";
import { construirUrlOrdenes } from "./filtros";

/**
 * Interruptor entre la lista y el calendario de órdenes. Cada opción es un enlace a la misma pantalla con los mismos
 * filtros, así que alternar no pierde nada y el enlace se puede compartir.
 */
export function SelectorDeVista({ filtros }: { filtros: FiltrosOrdenesTrabajo }) {
  const esCalendario = filtros.vista === "calendario";
  return (
    <nav aria-label="Vista de las órdenes" className="selector-vista">
      <Link
        aria-current={esCalendario ? undefined : "page"}
        className={"selector-vista-opcion" + (esCalendario ? "" : " selector-vista-activa")}
        href={construirUrlOrdenes({ ...filtros, vista: "", pagina: 1 })}
      >
        Lista
      </Link>
      <Link
        aria-current={esCalendario ? "page" : undefined}
        className={"selector-vista-opcion" + (esCalendario ? " selector-vista-activa" : "")}
        href={construirUrlOrdenes({ ...filtros, vista: "calendario", pagina: 1 })}
      >
        Calendario
      </Link>
    </nav>
  );
}
