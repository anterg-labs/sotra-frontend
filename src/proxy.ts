import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { decidirAcceso } from "@/seguridad/acceso";
import { COOKIE_VISTA, leerModoVista } from "@/seguridad/vista";

/** Política de contenido con nonce por solicitud. Los atributos `style` en línea de React se permiten solo en `style-src-attr`. */
export function construirPolitica(nonce: string, origenApi: string | null, esDesarrollo: boolean, origenKeycloak: string | null = null) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    // El inicio y el cierre de sesión redirigen a Keycloak: Chrome aplica form-action también a esas redirecciones.
    `form-action 'self'${origenKeycloak ? ` ${origenKeycloak}` : ""}`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${esDesarrollo ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${origenApi ? ` ${origenApi}` : ""}`,
    ...(esDesarrollo ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function origenDe(direccion: string | undefined) {
  return direccion ? new URL(direccion).origin : null;
}

/** Nonce y política de esta solicitud: se ponen en los encabezados del pedido (para Next) y en la respuesta (para el navegador). */
function prepararPolitica(encabezadosBase: Headers) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const politica = construirPolitica(
    nonce,
    origenDe(process.env.API_URL),
    process.env.NODE_ENV === "development",
    origenDe(process.env.KEYCLOAK_EMISOR),
  );
  const encabezados = new Headers(encabezadosBase);
  encabezados.set("x-nonce", nonce);
  encabezados.set("Content-Security-Policy", politica);
  return { encabezados, politica };
}

/**
 * Decide con la sesión ya leída. `solicitud` trae `auth`, pero Auth.js le cambia el origen por `AUTH_URL`
 * (`http://localhost`): las reescrituras internas se arman con `original`, el pedido tal como llegó a Next.
 */
function decidir(solicitud: NextAuthRequest, original: NextRequest) {
  const { pathname, search, searchParams } = original.nextUrl;
  const sesion = solicitud.auth;
  const decision = decidirAcceso({
    ruta: pathname,
    consulta: search,
    haySesion: Boolean(sesion) && !sesion?.error,
    roles: sesion?.roles ?? [],
    esServerAction: original.headers.has("next-action"),
    vistaEscritorio: leerModoVista(original.cookies.get(COOKIE_VISTA)?.value) === "escritorio",
  });

  if (decision.tipo === "sin-sesion-api") return new NextResponse(null, { status: 401 });
  if (decision.tipo === "iniciar-sesion" || decision.tipo === "redirigir") {
    return NextResponse.redirect(new URL(decision.destino, original.url));
  }
  if (decision.tipo === "sin-permiso") {
    const destino = original.nextUrl.clone();
    destino.pathname = "/sin-permiso";
    destino.search = "";
    const { encabezados, politica } = prepararPolitica(original.headers);
    const respuesta = NextResponse.rewrite(destino, { status: 403, request: { headers: encabezados } });
    respuesta.headers.set("Content-Security-Policy", politica);
    return respuesta;
  }

  // Enlaces viejos `/activos?seccion=modelos|tipos` a las subsecciones.
  if (pathname === "/activos" && searchParams.has("seccion")) {
    const seccion = searchParams.get("seccion");
    const destino = new URL(solicitud.nextUrl);
    if (seccion === "modelos" || seccion === "tipos") destino.pathname = `/activos/${seccion}`;
    destino.searchParams.delete("seccion");
    return NextResponse.redirect(destino, 308);
  }

  const { encabezados, politica } = prepararPolitica(original.headers);
  for (const [nombre, valor] of Object.entries(decision.encabezados)) encabezados.set(nombre, valor);
  const respuesta = NextResponse.next({ request: { headers: encabezados } });
  respuesta.headers.set("Content-Security-Policy", politica);
  return respuesta;
}

/** Páginas que no piden sesión (inicio y cierre de sesión, error de login y «sin conexión»): solo reciben la política de contenido. */
export function esRutaPublica(ruta: string) {
  return /^\/(login|logout|sin-conexion)(\/|$)/.test(ruta);
}

/**
 * Corre antes de cada página, Server Action y pedido a `/api/v1`. Con `auth(...)`, Auth.js lee la sesión y, si el token
 * de acceso está por vencer, lo renueva y guarda la cookie nueva en la respuesta. Después decide con `decidirAcceso`:
 * sin sesión, al login de Keycloak (o 401 en `/api/v1`); sin el rol de la página, la pantalla «sin permiso».
 * Con la configuración diferida de `src/auth.ts`, `auth(fn)` devuelve una promesa del middleware.
 */
export async function proxy(original: NextRequest, evento: NextFetchEvent) {
  if (esRutaPublica(original.nextUrl.pathname)) {
    const { encabezados, politica } = prepararPolitica(original.headers);
    const respuesta = NextResponse.next({ request: { headers: encabezados } });
    respuesta.headers.set("Content-Security-Policy", politica);
    return respuesta;
  }

  const conSesion = (await auth((solicitud) => decidir(solicitud, original))) as unknown as NextMiddleware;
  return conSesion(original, evento);
}

export const config = {
  // Todo menos Auth.js y los archivos estáticos. Las páginas públicas (login, logout y «sin conexión») entran para recibir la
  // política de contenido, pero `proxy` no les pide sesión.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|images/|icons/|favicon.ico|sw.js|manifest.webmanifest).*)",
  ],
};
