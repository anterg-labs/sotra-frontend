"use client";

import { useEffect } from "react";

/** Registra el service worker en producción para que la aplicación se pueda instalar y muestre «sin conexión». */
export function RegistroServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Sin service worker la aplicación sigue funcionando; solo se pierde la instalación y la pantalla sin conexión.
    });
  }, []);

  return null;
}
