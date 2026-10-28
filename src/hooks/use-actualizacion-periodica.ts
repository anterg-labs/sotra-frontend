"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Vuelve a pedir al servidor los datos de la pantalla cada cierto tiempo mientras está visible y hay conexión,
 * y apenas la persona regresa a la pestaña o a la app. Así lo asignado desde otro lugar aparece sin recargar.
 */
export function useActualizacionPeriodica(intervaloMs: number, activa = true) {
  const enrutador = useRouter();

  useEffect(() => {
    if (!activa) return;
    const actualizar = () => {
      if (document.visibilityState === "visible" && navigator.onLine) enrutador.refresh();
    };
    const temporizador = window.setInterval(actualizar, intervaloMs);
    document.addEventListener("visibilitychange", actualizar);
    window.addEventListener("online", actualizar);
    return () => {
      window.clearInterval(temporizador);
      document.removeEventListener("visibilitychange", actualizar);
      window.removeEventListener("online", actualizar);
    };
  }, [enrutador, intervaloMs, activa]);
}
