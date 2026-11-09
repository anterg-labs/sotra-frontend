import { handlers } from "@/auth";
import { NextRequest } from "next/server";
import { esDestinoInterno, rutaDeInicioDeSesion } from "@/servicios/api/solicitudes-http";
import { usaCookiesSeguras } from "@/seguridad/keycloak";
import { registrarFalloSesion } from "@/servicios/servidor/registro-fallo-sesion";

/** Marca que el login ya se reintentó solo una vez. Solo viaja a `/api/auth` y dura lo justo para el reintento. */
const COOKIE_REINTENTO_LOGIN = "sotra-reintento-login";
const DURACION_REINTENTO_SEGUNDOS = 5 * 60;
const COOKIES_DESTINO = ["__Secure-authjs.callback-url", "authjs.callback-url"];

/** Usa el mismo origen que Auth.js al iniciar el login, incluido el puerto público de Docker. */
function conOrigenPublico(solicitud: NextRequest): NextRequest {
  const original = new URL(solicitud.url);
  const host = solicitud.headers.get("x-forwarded-host") ?? solicitud.headers.get("host");
  const protocolo = solicitud.headers.get("x-forwarded-proto");
  const esquema = protocolo === "http" || protocolo === "https" ? protocolo + ":" : original.protocol;
  const direccion = new URL(original.pathname + original.search, host ? `${esquema}//${host}` : original.origin);
  return new NextRequest(new Request(direccion, solicitud));
}

function cookieReintento(valor: string, duracion: number) {
  return `${COOKIE_REINTENTO_LOGIN}=${valor}; Path=/api/auth; Max-Age=${duracion}; HttpOnly; SameSite=Lax${usaCookiesSeguras() ? "; Secure" : ""}`;
}

/** La página que se había pedido antes del login (cookie de Auth.js con la dirección completa), o `/`. */
function destinoGuardado(solicitud: NextRequest) {
  for (const nombre of COOKIES_DESTINO) {
    const valor = solicitud.cookies.get(nombre)?.value;
    if (!valor) continue;
    try {
      const url = new URL(valor, "http://x");
      const ruta = url.pathname + url.search;
      if (esDestinoInterno(ruta) && !ruta.startsWith("/login")) return ruta;
    } catch {
      // Cookie dañada: se vuelve al inicio.
    }
  }
  return "/";
}

/**
 * Un callback que falla por `Configuration` casi siempre es la cookie de `state` vencida (pantalla de Keycloak abierta
 * más de 15 minutos) o un login ya usado («Atrás», pestaña vieja). Keycloak conserva la sesión, así que un login nuevo
 * entra sin pedir la contraseña: se reintenta una vez sola, y si vuelve a fallar se muestra la pantalla de error.
 */
function conReintento(solicitud: NextRequest, respuesta: Response, destino: URL): Response {
  const encabezados = new Headers(respuesta.headers);
  if (destino.searchParams.get("error") === "Configuration" && !solicitud.cookies.has(COOKIE_REINTENTO_LOGIN)) {
    encabezados.set("location", new URL(rutaDeInicioDeSesion(destinoGuardado(solicitud)), destino).toString());
    encabezados.append("set-cookie", cookieReintento("1", DURACION_REINTENTO_SEGUNDOS));
  } else {
    // Ya se reintentó: se muestra el error y se borra la marca, así «Volver a iniciar sesión» tiene su propio reintento.
    encabezados.append("set-cookie", cookieReintento("", 0));
  }
  return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers: encabezados });
}

async function ejecutar(solicitud: NextRequest, metodo: "GET" | "POST") {
  try {
    const respuesta = await handlers[metodo](conOrigenPublico(solicitud));
    const ubicacion = respuesta.headers.get("location");
    const destino = ubicacion ? new URL(ubicacion, solicitud.url) : null;
    if (destino?.pathname === "/login/error") {
      await registrarFalloSesion("AUTH_CALLBACK_ERROR", respuesta.status);
      return conReintento(solicitud, respuesta, destino);
    }
    if (solicitud.cookies.has(COOKIE_REINTENTO_LOGIN) && solicitud.nextUrl.pathname.startsWith("/api/auth/callback/")) {
      // El login terminó bien: la marca ya no hace falta.
      const encabezados = new Headers(respuesta.headers);
      encabezados.append("set-cookie", cookieReintento("", 0));
      return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers: encabezados });
    }
    return respuesta;
  } catch (error) {
    await registrarFalloSesion("AUTH_CALLBACK_ERROR");
    throw error;
  }
}

export function GET(solicitud: NextRequest) {
  return ejecutar(solicitud, "GET");
}

export function POST(solicitud: NextRequest) {
  return ejecutar(solicitud, "POST");
}
