import { NextResponse, type NextRequest } from "next/server";
import { esDestinoInterno } from "@/servicios/api/solicitudes-http";
import { COOKIE_VISTA } from "@/seguridad/vista";

const UN_ANIO_SEGUNDOS = 365 * 24 * 60 * 60;

/**
 * Cambia la vista del técnico (`?modo=escritorio|movil`) y vuelve a `destino`. Es una preferencia de pantalla:
 * no da permisos (la API sigue limitando al técnico a sus órdenes). La redirección recarga la página completa,
 * así el layout se vuelve a armar con la vista nueva.
 */
export function GET(solicitud: NextRequest) {
  const modo = solicitud.nextUrl.searchParams.get("modo") === "escritorio" ? "escritorio" : "movil";
  const destino = solicitud.nextUrl.searchParams.get("destino");
  // Location relativa: dentro de Docker, la URL que ve Next (puerto 3000) no es la del navegador.
  const respuesta = new NextResponse(null, { status: 307, headers: { Location: esDestinoInterno(destino) ? destino : "/" } });
  respuesta.cookies.set(COOKIE_VISTA, modo, { path: "/", maxAge: UN_ANIO_SEGUNDOS, sameSite: "lax", httpOnly: true });
  return respuesta;
}
