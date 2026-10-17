import "server-only";
import { ErrorDeApi, leerErrorDelServidor, obtenerUrlBaseApiServidor } from "@/servicios/api/solicitudes-http";

const TIEMPO_ESPERA_MS = 10_000;

/**
 * Pedido a la API desde el servidor de Next (Server Components y Server Actions).
 * Sin caché (los datos siempre son los vigentes), con tiempo de espera y errores como `ErrorDeApi`.
 */
export async function solicitarApiServidor(ruta: string, opciones: RequestInit, mensajeError: string) {
  let respuesta: Response;
  try {
    respuesta = await fetch(obtenerUrlBaseApiServidor() + ruta, {
      ...opciones,
      cache: "no-store",
      signal: AbortSignal.timeout(TIEMPO_ESPERA_MS),
    });
  } catch {
    throw new ErrorDeApi(mensajeError, "API_NO_DISPONIBLE", 503);
  }

  if (!respuesta.ok) {
    throw await leerErrorDelServidor(respuesta, mensajeError);
  }

  return respuesta;
}

export async function leerJsonServidor<T>(ruta: string, mensajeError: string, opciones: RequestInit = {}) {
  const respuesta = await solicitarApiServidor(ruta, opciones, mensajeError);
  return (await respuesta.json()) as T;
}

export function opcionesJsonServidor(metodo: "POST" | "PUT" | "PATCH", cuerpo: unknown): RequestInit {
  return { method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) };
}
