import { afterEach, describe, expect, it, vi } from "vitest";
import { apiSolicitarSugerenciaOrdenTrabajo } from "./api-ordenes-trabajo";

function responderConTrozos(...trozos: string[]) {
  const codificador = new TextEncoder();
  const cuerpo = new ReadableStream<Uint8Array>({
    start(controlador) {
      for (const trozo of trozos) controlador.enqueue(codificador.encode(trozo));
      controlador.close();
    },
  });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(cuerpo, { status: 200 })));
}

/** Un evento del servidor tal como lo escribe la API. */
const evento = (json: string) => "data: " + json + "\n\n";

const DATOS = { descripcion: "x", numero: 1, sesion: "s" };

describe("sugerencia con etapas", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("avisa cada etapa y devuelve la sugerencia, aunque los eventos lleguen partidos", async () => {
    responderConTrozos('data: {"etapa":"buscando"}\n\ndata: {"eta', 'pa":"redactando"}\n\n', evento('{"sugerencia":"Cambiar el filtro","modo":"ia"}'));
    const etapas: string[] = [];

    const resultado = await apiSolicitarSugerenciaOrdenTrabajo(DATOS, (etapa) => etapas.push(etapa));

    expect(etapas).toEqual(["buscando", "redactando"]);
    expect(resultado).toEqual({ sugerencia: "Cambiar el filtro", modo: "ia" });
  });

  it("acepta el último evento sin línea en blanco, saltos \\r\\n y comentarios del proxy", async () => {
    responderConTrozos(': ping\r\n\r\ndata: {"etapa":"buscando"}\r\n\r\n', 'data: {"sugerencia":"Listo","modo":"sin_ia"}');
    await expect(apiSolicitarSugerenciaOrdenTrabajo(DATOS)).resolves.toEqual({ sugerencia: "Listo", modo: "sin_ia" });
  });

  it("un 422 informado en la respuesta muestra que no hay documentación", async () => {
    responderConTrozos(evento('{"etapa":"buscando"}') + evento('{"error":{"estado":422,"codigo":"SIN_CONTEXTO_TECNICO","mensaje":"m"}}'));
    await expect(apiSolicitarSugerenciaOrdenTrabajo(DATOS)).rejects.toThrow("no encontró información suficiente");
  });

  it("otro error o una respuesta cortada muestran el mensaje general", async () => {
    responderConTrozos(evento('{"error":{"estado":502,"codigo":"SUGERENCIA_FALLIDA","mensaje":"m"}}'));
    await expect(apiSolicitarSugerenciaOrdenTrabajo(DATOS)).rejects.toThrow("No se pudo obtener la sugerencia");

    responderConTrozos(evento('{"etapa":"buscando"}'));
    await expect(apiSolicitarSugerenciaOrdenTrabajo(DATOS)).rejects.toThrow("No se pudo obtener la sugerencia");
  });
});
