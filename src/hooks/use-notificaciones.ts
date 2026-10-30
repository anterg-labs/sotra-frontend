"use client";

import { useCallback, useEffect, useState } from "react";
import { contarNotificacionesNoLeidas } from "@/servicios/servicio-notificaciones";

const INTERVALO_ACTUALIZACION_MS = 30_000;

/**
 * Cantidad de notificaciones sin leer de la persona con sesión. Se consulta al montar, cada 30 segundos con la pantalla
 * visible y apenas se vuelve a la pestaña. Es informativo: si la consulta falla se conserva el último valor.
 */
export function useNotificacionesNoLeidas() {
  const [noLeidas, setNoLeidas] = useState(0);

  const actualizar = useCallback(async () => {
    try {
      setNoLeidas(await contarNotificacionesNoLeidas());
    } catch {
      // Se conserva el último valor.
    }
  }, []);

  useEffect(() => {
    const consultarSiEsVisible = () => {
      if (document.visibilityState === "visible") void actualizar();
    };
    consultarSiEsVisible();
    const temporizador = window.setInterval(consultarSiEsVisible, INTERVALO_ACTUALIZACION_MS);
    document.addEventListener("visibilitychange", consultarSiEsVisible);
    return () => {
      window.clearInterval(temporizador);
      document.removeEventListener("visibilitychange", consultarSiEsVisible);
    };
  }, [actualizar]);

  return { noLeidas, setNoLeidas, actualizar };
}
