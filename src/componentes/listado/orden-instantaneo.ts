"use client";

import { useMemo } from "react";
import { useNavegacionListado } from "./navegacion-listado";
import { ordenarFilas, type ValorOrdenable } from "./orden-local";

/**
 * Orden al instante para los listados paginados: en cuanto se hace clic en un título, las filas que ya están en pantalla se
 * reordenan en el navegador, sin esperar al servidor. Solo se usa cuando el listado cabe en una página (`activo`): si hay más,
 * las filas visibles no son todas y el orden correcto lo decide el servidor, que mientras tanto deja la tabla a la vista.
 * Cuando llega la respuesta, las filas ya vienen ordenadas por el servidor y este orden temporal deja de aplicarse.
 */
export function useFilasConOrdenInstantaneo<T>(filas: readonly T[], valores: Record<string, (fila: T) => ValorOrdenable>, activo: boolean): readonly T[] {
  const { ordenPendiente } = useNavegacionListado();
  return useMemo(() => {
    if (!activo || !ordenPendiente?.ordenarPor || ordenPendiente.direccionOrden === "") return filas;
    const obtener = valores[ordenPendiente.ordenarPor];
    return obtener ? ordenarFilas(filas, obtener, ordenPendiente.direccionOrden) : filas;
    // `valores` se declara fuera del componente: depender de él no aporta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, ordenPendiente, activo]);
}
