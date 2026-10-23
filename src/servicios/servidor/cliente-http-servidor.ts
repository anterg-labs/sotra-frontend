import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ENCABEZADO_RUTA_PEDIDA,
  ErrorDeApi,
  esDestinoInterno,
  leerErrorDelServidor,
  obtenerUrlBaseApiServidor,
  rutaDeInicioDeSesion,
} from "@/servicios/api/solicitudes-http";
import { obtenerTokenAcceso } from "@/servicios/servidor/token-acceso";

const TIEMPO_ESPERA_MS = 10_000;

/** Sin sesión válida (o la API rechazó el token): al login y de vuelta a la página en la que estaba. */
async function redirigirAlInicioDeSesion(): Promise<never> {
  const rutaPedida = (await headers()).get(ENCABEZADO_RUTA_PEDIDA);
  redirect(rutaDeInicioDeSesion(esDestinoInterno(rutaPedida) ? rutaPedida : "/"));
}

/**
 * Pedido a la API desde el servidor de Next (Server Components y Server Actions), con el token de la sesión.
 * Sin caché (los datos siempre son los vigentes), con tiempo de espera y errores como `ErrorDeApi`.
 */
export async function solicitarApiServidor(ruta: string, opciones: RequestInit, mensajeError: string) {
  const token = await obtenerTokenAcceso();
  if (!token) return redirigirAlInicioDeSesion();

  const encabezados = new Headers(opciones.headers);
  encabezados.set("Authorization", "Bearer " + token);

  let respuesta: Response;
  try {
    respuesta = await fetch(obtenerUrlBaseApiServidor() + ruta, {
      ...opciones,
      headers: encabezados,
      cache: "no-store",
      signal: AbortSignal.timeout(TIEMPO_ESPERA_MS),
    });
  } catch {
    throw new ErrorDeApi(mensajeError, "API_NO_DISPONIBLE", 503);
  }

  if (respuesta.status === 401) return redirigirAlInicioDeSesion();
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
