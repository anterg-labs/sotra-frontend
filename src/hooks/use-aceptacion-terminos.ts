"use client";

import { useSyncExternalStore } from "react";
import {
  analizarAceptacion,
  leerAceptacionCruda,
  suscribirseAAceptacion,
  type AceptacionGuardada,
} from "@/utilidades/aceptacion-terminos";

/** Aceptación guardada en este navegador; se actualiza si cambia en otra pestaña. En el servidor es siempre `null`. */
export function useAceptacionGuardada(): AceptacionGuardada | null {
  const crudo = useSyncExternalStore(suscribirseAAceptacion, leerAceptacionCruda, () => null);
  return analizarAceptacion(crudo);
}
