import { vi } from "vitest";

export type LlamadaFetch = {
  url: string;
  metodo: string;
  cuerpo: unknown;
  encabezados: Record<string, string>;
  opciones: RequestInit;
};

type Respuesta = { estado?: number; cuerpo?: unknown };
type Manejador = (llamada: LlamadaFetch) => Respuesta | Promise<Respuesta>;

export function responderJson(cuerpo: unknown, estado = 200) {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: { "Content-Type": "application/json" } });
}

/** Simula fetch con un manejador y registra las llamadas realizadas. */
export function simularFetch(manejador: Manejador) {
  const llamadas: LlamadaFetch[] = [];
  const simulado = vi.fn(async (entrada: string | URL | Request, opciones: RequestInit = {}) => {
    let cuerpo: unknown = null;
    if (typeof opciones.body === "string") cuerpo = JSON.parse(opciones.body);
    else if (opciones.body !== undefined && opciones.body !== null) cuerpo = opciones.body;
    const llamada: LlamadaFetch = {
      url: String(entrada),
      metodo: opciones.method ?? "GET",
      cuerpo,
      encabezados: (opciones.headers ?? {}) as Record<string, string>,
      opciones,
    };
    llamadas.push(llamada);
    const { estado = 200, cuerpo: cuerpoRespuesta = {} } = await manejador(llamada);
    if (estado === 204) return new Response(null, { status: 204 });
    return responderJson(cuerpoRespuesta, estado);
  });
  vi.stubGlobal("fetch", simulado);
  return { llamadas, simulado };
}

export function paginaDe<T>(
  elementos: T[],
  extra: Partial<{ pagina: number; totalPaginas: number; totalElementos: number }> = {},
) {
  return { elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1, ...extra };
}
