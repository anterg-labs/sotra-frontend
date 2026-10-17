import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listarActivosPaginados, obtenerDetalleActivo } from "@/servicios/servicio-activos";

describe("servicio-activos", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const activo = {
      id: 1, clienteId: 1, numSerie: "CAT320D-0001", descripcion: null, modeloMaquinaId: 1, anioFabricacion: 2024,
      nombre: "Excavadora 01", ubicacion: "Obra norte", estado: "activo",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (entrada: string | URL | Request) => {
        const url = String(entrada);
        if (url.endsWith("/activos/9999")) return new Response(null, { status: 404 });
        if (url.endsWith("/activos/1")) return Response.json(activo);
        return Response.json({ elementos: [activo], pagina: 1, tamanoPagina: 20, totalElementos: 1, totalPaginas: 1 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("obtiene el listado paginado de activos", async () => {
    const respuesta = await listarActivosPaginados({ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "", pagina: 1 });
    expect(respuesta.elementos).toHaveLength(1);
    expect(respuesta.elementos[0].numSerie).toBe("CAT320D-0001");
  });

  it("obtiene el detalle y falla con un mensaje claro si no existe", async () => {
    expect((await obtenerDetalleActivo(1)).nombre).toBe("Excavadora 01");
    await expect(obtenerDetalleActivo(9999)).rejects.toThrow("No se pudo obtener el activo solicitado.");
  });
});
