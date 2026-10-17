import "server-only";

/** Opciones de un filtro buscable: la primera página y, si el valor elegido no está, ese registro al principio. */
export async function conSeleccionado<T extends { id: number }>(
  primeraPagina: T[],
  seleccionadoId: string,
  obtener: (id: number) => Promise<T>,
) {
  if (seleccionadoId === "" || primeraPagina.some((registro) => String(registro.id) === seleccionadoId)) return primeraPagina;
  const elegido = await obtener(Number(seleccionadoId)).catch(() => null);
  return elegido ? [elegido, ...primeraPagina] : primeraPagina;
}
