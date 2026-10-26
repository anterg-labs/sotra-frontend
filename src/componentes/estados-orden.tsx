"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { OpcionEstadoOrden } from "@/tipos/orden-trabajo";

const ContextoEstadosOrden = createContext<OpcionEstadoOrden[]>([]);

/** El layout raíz carga el catálogo de estados en el servidor (tabla `estado_ot`) y lo comparte con los componentes de cliente. */
export function ProveedorEstadosOrden(props: { estados: OpcionEstadoOrden[]; children: ReactNode }) {
  return <ContextoEstadosOrden.Provider value={props.estados}>{props.children}</ContextoEstadosOrden.Provider>;
}

/** Estados de las órdenes en el orden del ciclo de vida, con su etiqueta. */
export function useEstadosOrden() {
  return useContext(ContextoEstadosOrden);
}

/** Sin etiqueta en el catálogo, el valor con espacios y la primera letra en mayúscula: nunca `en_ejecucion` a la vista. */
export function etiquetaLegible(valor: string) {
  const legible = valor.replace(/_/g, " ").trim();
  return legible === "" ? legible : legible[0].toLocaleUpperCase("es") + legible.slice(1);
}

/** Etiqueta de un estado según el catálogo; si no está, una legible armada con su valor. */
export function useEtiquetaEstadoOrden() {
  const estados = useEstadosOrden();
  return useCallback((valor: string) => estados.find((estado) => estado.valor === valor)?.etiqueta ?? etiquetaLegible(valor), [estados]);
}
