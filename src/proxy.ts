import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/auth";
import { decidirAcceso } from "@/seguridad/acceso";
import { COOKIE_VISTA, leerModoVista } from "@/seguridad/vista";

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
    return NextResponse.redirect(new URL(decision.destino, solicitud.url));
  }
  if (decision.tipo === "sin-permiso") {
    const destino = original.nextUrl.clone();
    destino.pathname = "/sin-permiso";
    destino.search = "";
    return NextResponse.rewrite(destino, { status: 403 });
  }

  // Enlaces viejos `/activos?seccion=modelos|tipos` a las subsecciones.
  if (pathname === "/activos" && searchParams.has("seccion")) {
    const seccion = searchParams.get("seccion");
    const destino = new URL(solicitud.nextUrl);
    if (seccion === "modelos" || seccion === "tipos") destino.pathname = `/activos/${seccion}`;
    destino.searchParams.delete("seccion");
    return NextResponse.redirect(destino, 308);
  }

  const encabezados = new Headers(original.headers);
  for (const [nombre, valor] of Object.entries(decision.encabezados)) encabezados.set(nombre, valor);
  return NextResponse.next({ request: { headers: encabezados } });
}

/**
 * Corre antes de cada página, Server Action y pedido a `/api/v1`. Con `auth(...)`, Auth.js lee la sesión y, si el token
 * de acceso está por vencer, lo renueva y guarda la cookie nueva en la respuesta. Después decide con `decidirAcceso`:
 * sin sesión, al login de Keycloak (o 401 en `/api/v1`); sin el rol de la página, la pantalla «sin permiso».
 * Con la configuración diferida de `src/auth.ts`, `auth(fn)` devuelve una promesa del middleware.
 */
export async function proxy(original: NextRequest, evento: NextFetchEvent) {
  const conSesion = (await auth((solicitud) => decidir(solicitud, original))) as unknown as NextMiddleware;
  return conSesion(original, evento);
}

export const config = {
  // Todo menos Auth.js, el inicio y el cierre de sesión, la página sin conexión (la guarda el service worker) y los archivos estáticos.
  matcher: [
    "/((?!api/auth|login|logout|sin-conexion|_next/static|_next/image|images/|icons/|favicon.ico|sw.js|manifest.webmanifest).*)",
  ],
};
