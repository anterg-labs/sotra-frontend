const HUSO_HORARIO = "America/Montevideo";

/** Fecha de hoy como `AAAA-MM-DD` en el huso horario de la empresa, igual en el servidor y en el navegador. */
export function obtenerFechaDeHoy() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: HUSO_HORARIO, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
