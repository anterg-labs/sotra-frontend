/**
 * Aceptación de los términos guardada en el navegador. Es TEMPORAL: mientras no haya sesión (Keycloak) no se sabe quién
 * acepta, así que la aceptación vale para el navegador. Con el inicio de sesión pasará a guardarse en la base por persona
 * (`POST /terminos/aceptaciones`, que el backend ya soporta), exigiendo aceptar a la persona autenticada.
 * Lo guardado por navegador no prueba la aceptación de una persona concreta.
 */
export const CLAVE_ACEPTACION_TERMINOS = "sotra.terminos.aceptacion";
/** `storage` solo avisa a las otras pestañas: este evento avisa a la misma. */
export const EVENTO_ACEPTACION_TERMINOS = "sotra:terminos-aceptados";

export type AceptacionGuardada = { terminosId: number; version: number; aceptadoEn: string };

/** Interpreta lo guardado; cualquier cosa corrupta o con otra forma equivale a «no aceptó». */
export function analizarAceptacion(crudo: string | null): AceptacionGuardada | null {
  if (crudo === null) return null;
  try {
    const dato: unknown = JSON.parse(crudo);
    if (typeof dato !== "object" || dato === null) return null;
    const { terminosId, version, aceptadoEn } = dato as Record<string, unknown>;
    if (
      typeof terminosId !== "number" || !Number.isInteger(terminosId) || terminosId <= 0 ||
      typeof version !== "number" || !Number.isInteger(version) || version <= 0 ||
      typeof aceptadoEn !== "string" || Number.isNaN(Date.parse(aceptadoEn))
    ) {
      return null;
    }
    return { terminosId, version, aceptadoEn };
  } catch {
    return null;
  }
}

/** Texto guardado, o `null` si no hay o el almacenamiento no está disponible (modo privado, bloqueado). */
export function leerAceptacionCruda(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_ACEPTACION_TERMINOS);
  } catch {
    return null;
  }
}

/** Devuelve `false` si no se pudo guardar; en ese caso los términos se vuelven a pedir en cada carga. */
export function guardarAceptacion(aceptacion: AceptacionGuardada): boolean {
  try {
    window.localStorage.setItem(CLAVE_ACEPTACION_TERMINOS, JSON.stringify(aceptacion));
  } catch {
    return false;
  } finally {
    window.dispatchEvent(new Event(EVENTO_ACEPTACION_TERMINOS));
  }
  return leerAceptacionCruda() !== null;
}

export function suscribirseAAceptacion(alCambiar: () => void) {
  const alCambiarOtraPestana = (evento: StorageEvent) => {
    if (evento.key === null || evento.key === CLAVE_ACEPTACION_TERMINOS) alCambiar();
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  window.addEventListener(EVENTO_ACEPTACION_TERMINOS, alCambiar);
  return () => {
    window.removeEventListener("storage", alCambiarOtraPestana);
    window.removeEventListener(EVENTO_ACEPTACION_TERMINOS, alCambiar);
  };
}
