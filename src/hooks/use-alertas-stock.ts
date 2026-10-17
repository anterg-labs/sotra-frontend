"use client";

import { useEffect, useState } from "react";
import { obtenerAlertasStock } from "@/servicios/servicio-repuestos";
import type { AlertasStock } from "@/tipos/repuesto";

const EVENTO_STOCK_ACTUALIZADO = "sotra:stock-actualizado";
const INTERVALO_ACTUALIZACION_MS = 60_000;

/** Avisa a los contadores de alertas que el stock cambió y deben consultarse de nuevo. */
export function avisarStockActualizado() {
  window.dispatchEvent(new Event(EVENTO_STOCK_ACTUALIZADO));
}

/** Contadores de alertas de stock; se actualizan cada minuto y después de cada movimiento de stock. */
export function useAlertasStock() {
  const [alertas, setAlertas] = useState<AlertasStock | null>(null);

  useEffect(() => {
    let estaMontado = true;

    async function consultar() {
      try {
        const alertasObtenidas = await obtenerAlertasStock();
        if (estaMontado) setAlertas(alertasObtenidas);
      } catch {
        // El contador es informativo: si falla se conserva el último valor.
      }
    }

    consultar();
    const temporizador = window.setInterval(consultar, INTERVALO_ACTUALIZACION_MS);
    window.addEventListener(EVENTO_STOCK_ACTUALIZADO, consultar);

    return () => {
      estaMontado = false;
      window.clearInterval(temporizador);
      window.removeEventListener(EVENTO_STOCK_ACTUALIZADO, consultar);
    };
  }, []);

  return alertas;
}
