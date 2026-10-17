import "server-only";
import { leerJsonServidor, opcionesJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { AceptarTerminosInput, EstadoTerminos, PublicarTerminosInput, TerminosCondiciones } from "@/tipos/terminos";

export function obtenerTerminosVigentesServidor() {
  return leerJsonServidor<TerminosCondiciones>("/api/v1/terminos/vigente", "No se pudieron obtener los términos y condiciones.");
}

export function obtenerEstadoTerminosServidor(usuarioId: number) {
  return leerJsonServidor<EstadoTerminos>(
    "/api/v1/terminos/estado?usuarioId=" + usuarioId,
    "No se pudo obtener el estado de los términos y condiciones.",
  );
}

export function aceptarTerminosServidor(aceptacion: AceptarTerminosInput) {
  return leerJsonServidor<EstadoTerminos>(
    "/api/v1/terminos/aceptaciones",
    "No se pudo registrar la aceptación de los términos y condiciones.",
    opcionesJsonServidor("POST", aceptacion),
  );
}

export function publicarTerminosServidor(terminos: PublicarTerminosInput) {
  return leerJsonServidor<TerminosCondiciones>(
    "/api/v1/terminos",
    "No se pudieron guardar los términos y condiciones.",
    opcionesJsonServidor("POST", terminos),
  );
}
