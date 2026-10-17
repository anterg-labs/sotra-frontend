import "server-only";

export type ConsultaAnticipada<T> = Promise<{ estado: "listo"; datos: T } | { estado: "error"; error: unknown }>;

/** Inicia la lectura antes de preparar filtros sin dejar rechazos sin manejar mientras se renderiza. */
export function anticiparConsulta<T>(consulta: Promise<T>): ConsultaAnticipada<T> {
  return Promise.resolve(consulta).then(
    (datos) => ({ estado: "listo", datos }),
    (error: unknown) => ({ estado: "error", error }),
  );
}

export async function resolverConsulta<T>(consulta: ConsultaAnticipada<T>): Promise<T> {
  const resultado = await consulta;
  if (resultado.estado === "error") throw resultado.error;
  return resultado.datos;
}
