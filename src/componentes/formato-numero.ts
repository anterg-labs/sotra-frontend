const FORMATO = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

/** Número con separadores del uruguayo («1.250,5»); sin datos se muestra «—». */
export function formatearNumero(valor: number | null | undefined) {
  return valor === null || valor === undefined ? "—" : FORMATO.format(valor);
}
