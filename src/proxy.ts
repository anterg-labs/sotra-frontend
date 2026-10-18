import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(solicitud: NextRequest) {
  if (!solicitud.nextUrl.searchParams.has("seccion")) {
    return NextResponse.next();
  }

  const seccion = solicitud.nextUrl.searchParams.get("seccion");
  const destino = solicitud.nextUrl.clone();
  if (seccion === "modelos" || seccion === "tipos") {
    destino.pathname = `/activos/${seccion}`;
  }
  destino.searchParams.delete("seccion");
  return NextResponse.redirect(destino, 308);
}

export const config = { matcher: "/activos" };
