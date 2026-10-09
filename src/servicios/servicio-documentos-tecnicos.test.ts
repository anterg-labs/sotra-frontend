import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  crearDocumentoTecnico,
  eliminarDocumentoTecnico,
  listarDocumentosTecnicos,
} from "@/servicios/servicio-documentos-tecnicos";

describe("servicio-documentos-tecnicos", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const documentosSimulados = [
      {
        id: 1,
        nombreArchivo: "manual.pdf",
        activoId: 1,
        nombreActivo: "Excavadora 01",
        usaSugerenciasIA: true,
        cantidadFragmentos: 2,
        creadoEn: "2026-09-24T03:16:31.214Z",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (entrada: string | URL | Request, opciones?: RequestInit) => {
        if (opciones && opciones.method === "DELETE") {
          return new Response(null, { status: 204 });
        }

        const paginaSimulada = {
          elementos: documentosSimulados,
          pagina: 1,
          tamanoPagina: 100,
          totalElementos: 1,
          totalPaginas: 1,
        };
        return new Response(JSON.stringify(paginaSimulada), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("obtiene el listado de documentos técnicos", async () => {
    const respuesta = await listarDocumentosTecnicos();

    expect(respuesta).toHaveLength(1);
    expect(respuesta[0].nombreArchivo).toBe("manual.pdf");
  });

  it("no permite guardar sin seleccionar un archivo", async () => {
    const documentoSinArchivo = { archivo: null, activoId: null, usaSugerenciasIA: false };

    await expect(crearDocumentoTecnico(documentoSinArchivo)).rejects.toThrow("Seleccioná un archivo PDF.");
  });

  it("no permite guardar un archivo que no tiene extensión pdf", async () => {
    const archivoDeTexto = new File(["hola"], "notas.txt", { type: "text/plain" });
    const documentoConTexto = { archivo: archivoDeTexto, activoId: null, usaSugerenciasIA: false };

    await expect(crearDocumentoTecnico(documentoConTexto)).rejects.toThrow("El archivo debe tener la extensión .pdf.");
  });

  it("elimina un documento técnico", async () => {
    await expect(eliminarDocumentoTecnico(1)).resolves.toBeUndefined();
  });
});
