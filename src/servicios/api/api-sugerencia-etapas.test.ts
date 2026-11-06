import { afterEach, describe, expect, it, vi } from "vitest";
import { apiSolicitarSugerenciaOrdenTrabajo } from "./api-ordenes-trabajo";

function responderConLineas(...trozos: string[]) {
  const codificador = new TextEncoder();
  const cuerpo = new ReadableStream<Uint8Array>({
    start(controlador) {
      for (const trozo of trozos) controlador.enqueue(codificador.encode(trozo));
      controlador.close();
    },
  });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(cuerpo, { status: 200 })));
}

const DATOS = { descripcion: "x", numero: 1, sesion: "s" };

describe("sugerencia con etapas", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("avisa cada etapa y devuelve la sugerencia, aunque las líneas lleguen partidas", async () => {
    responderConLineas('{"etapa":"buscando"}\n{"eta', 'pa":"redactando"}\n', '{"sugerencia":"Cambiar el filtro","modo":"ia"}\n');
    const etapas: string[] = [];

    const resultado = await apiSolicitarSugerenciaOrdenTrabajo(DATOS, (etapa) => etapas.push(etapa));

    expect(etapas).toEqual(["buscando", "redactando"]);
    expect(resultado).toEqual({ sugerencia: "Cambiar el filtro", modo: "ia" });
  });

  it("acepta la última línea sin salto de línea", async () => {
    responderConLineas('{"sugerencia":"Listo","modo":"sin_ia"}');
    await expect(apiSolicitarSugerenciaOrdenTrabajo(DATOS)).resolves.toEqual({ sugerencia: "Listo", modo: "sin_ia" });
  });

  it("un 422 informado en la respuesta muestra que no hay documentación", async () => {
    responderConLineas('{"etapa":"buscando"}\n{"error":{"estado":422,"codigo":"SIN_CONTEXTO_TECNICO","mensaje":"m"}}\n');
    await expect(apiSolicitarSugerenciaOrdenTrabajo(DATOS)).rejects.toThrow("no encontró información suficiente");
  });

  it("otro error o una respuesta cortada muestran el mensaje general", async () => {
    responderConLineas('{"error":{"estado":502,"codigo":"SUGERENCIA_FALLIDA","mensaje":"m"}}\n');
    await expect(apiSolicitarSugerenciaOrdenTrabajo(DATOS)).rejects.toThrow("No se pudo obtener la sugerencia");

    responderConLineas('{"etapa":"buscando"}\n');
    await expect(apiSolicitarSugerenciaOrdenTrabajo(DATOS)).rejects.toThrow("No se pudo obtener la sugerencia");
  });
});
