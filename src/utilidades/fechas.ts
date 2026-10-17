/**
 * Las fechas se muestran siempre en el huso horario de la empresa. Así el servidor (que suele correr en UTC) y el navegador
 * generan el mismo texto y no hay diferencias de hidratación, ni corrimientos de día cerca de la medianoche.
 */
const HUSO_HORARIO = "America/Montevideo";
const formatoCorto = new Intl.DateTimeFormat("es-UY", { timeZone: HUSO_HORARIO });
const formatoNumerico = new Intl.DateTimeFormat("es-UY", { timeZone: HUSO_HORARIO, day: "2-digit", month: "2-digit", year: "numeric" });
const formatoFechaHora = new Intl.DateTimeFormat("es-UY", {
  timeZone: HUSO_HORARIO, day: "numeric", month: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
});

// Las versiones de ICU de Node y Chrome difieren en los espacios de «a. m.» y «p. m.».
function normalizarEspacios(texto: string) {
  return texto.replace(/[\u00a0\u202f]/g, " ");
}

export function formatearFechaCorta(instante: string | Date) {
  return normalizarEspacios(formatoCorto.format(new Date(instante)));
}

/** dd/mm/aaaa con ceros a la izquierda, en el huso horario de la empresa. */
export function formatearFechaNumerica(instante: string | Date) {
  return normalizarEspacios(formatoNumerico.format(new Date(instante)));
}

export function formatearFechaHora(instante: string | Date) {
  return normalizarEspacios(formatoFechaHora.format(new Date(instante)));
}
