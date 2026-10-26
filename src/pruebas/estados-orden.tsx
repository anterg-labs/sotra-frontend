import type { ReactNode } from "react";
import { ProveedorEstadosOrden } from "@/componentes/estados-orden";
import type { OpcionEstadoOrden } from "@/tipos/orden-trabajo";

/** Catálogo de estados tal como lo entrega la API (tabla `estado_ot`), en el orden del ciclo de vida. */
export const estadosDePrueba: OpcionEstadoOrden[] = [
  { valor: "creada", etiqueta: "Creada" },
  { valor: "asignada", etiqueta: "Asignada" },
  { valor: "en_ejecucion", etiqueta: "En ejecución" },
  { valor: "pausada", etiqueta: "Pausada" },
  { valor: "finalizada", etiqueta: "Finalizada" },
  { valor: "cerrada", etiqueta: "Cerrada" },
  { valor: "cancelada", etiqueta: "Cancelada" },
];

export function conEstadosOrden(contenido: ReactNode) {
  return <ProveedorEstadosOrden estados={estadosDePrueba}>{contenido}</ProveedorEstadosOrden>;
}
