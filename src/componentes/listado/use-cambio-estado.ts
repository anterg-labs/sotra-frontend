"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { ResultadoCambiarEstado } from "@/tipos/resultado-accion";

/**
 * Baja y reactivación desde una tabla: marca el registro como «en proceso» de inmediato (optimista) y
 * muestra el estado nuevo recién cuando el servidor lo confirma (la Server Action revalida el listado).
 */
export function useCambioEstado(
  accion: (id: number, estado: "activo" | "inactivo") => Promise<ResultadoCambiarEstado>,
  alExito?: (id: number, estado: "activo" | "inactivo") => void,
  alError?: (mensaje: string) => void,
) {
  const [enProcesoId, marcarEnProceso] = useOptimistic<number | null, number>(null, (_actual, id) => id);
  const [, iniciarTransicion] = useTransition();
  const [error, setError] = useState("");

  function ejecutar(id: number, estado: "activo" | "inactivo") {
    setError("");
    iniciarTransicion(async () => {
      marcarEnProceso(id);
      const resultado = await accion(id, estado);
      if (resultado.exito) {
        alExito?.(id, estado);
      } else {
        setError(resultado.mensaje);
        alError?.(resultado.mensaje);
      }
    });
  }

  return { enProcesoId, error, ejecutar };
}
