/**
 * Vista del técnico: por defecto usa la del celular en todas sus secciones; puede pasar a la de escritorio (y volver).
 * La elección se guarda en una cookie para que el proxy y el layout la lean en el servidor.
 */
export const COOKIE_VISTA = "sotra-vista";

export type ModoVista = "movil" | "escritorio";

export function leerModoVista(valorCookie: string | undefined): ModoVista {
  return valorCookie === "escritorio" ? "escritorio" : "movil";
}

/** La misma pantalla en la otra vista: «Mi trabajo» y su detalle equivalen al listado y al detalle de órdenes. */
export function rutaEnVista(modo: ModoVista, ruta: string): string {
  if (modo === "escritorio") {
    if (ruta === "/tecnico") return "/ordenes-trabajo";
    const detalle = ruta.match(/^\/tecnico\/(\d+)$/);
    return detalle ? "/ordenes-trabajo/" + detalle[1] : ruta;
  }
  if (ruta === "/ordenes-trabajo") return "/tecnico";
  const detalle = ruta.match(/^\/ordenes-trabajo\/(\d+)$/);
  return detalle ? "/tecnico/" + detalle[1] : ruta;
}

/** Enlace que cambia de vista y vuelve a la pantalla equivalente (`src/app/vista/route.ts`). */
export function urlCambioDeVista(modo: ModoVista, rutaActual: string): string {
  return "/vista?modo=" + modo + "&destino=" + encodeURIComponent(rutaEnVista(modo, rutaActual));
}
