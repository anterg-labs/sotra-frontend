import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearActivo, desactivarActivo, listarActivos, listarActivosPaginados } from "@/servicios/servicio-activos";

describe("servicio-activos", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const activosSimulados = [
      {
        id: 1,
        clienteId: 1,
        numSerie: "CAT320D-0001",
        descripcion: null,
        modeloMaquinaId: 1,
        anioFabricacion: 2024,
        nombre: "Excavadora 01",
        ubicacion: "Obra norte",
        estado: "activo",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (entrada: string | URL | Request, opciones?: RequestInit) => {
        if (opciones && opciones.method === "PATCH") {
          const activoDesactivado = {
            id: 1,
            clienteId: 1,
            numSerie: "CAT320D-0001",
            descripcion: null,
            modeloMaquinaId: 1,
            anioFabricacion: 2024,
            nombre: "Excavadora 01",
            ubicacion: "Obra norte",
            estado: "inactivo",
          };

          return new Response(JSON.stringify(activoDesactivado), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const paginaSimulada = {
          elementos: activosSimulados,
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

  it("obtiene el listado de activos", async () => {
    const respuesta = await listarActivos();

    expect(respuesta).toHaveLength(1);
    expect(respuesta[0].nombre).toBe("Excavadora 01");
    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/api/v1/activos?pagina=1&tamanoPagina=100", { cache: "no-store" });
  });

  it("obtiene una página de activos con los filtros completados", async () => {
    const filtros = { buscar: " excavadora ", clienteId: "3", modeloMaquinaId: "", estado: "activo", pagina: 2 };

    const respuesta = await listarActivosPaginados(filtros);

    expect(respuesta.elementos).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/activos?buscar=excavadora&clienteId=3&estado=activo&pagina=2",
      { cache: "no-store" },
    );
  });

  it("no permite crear un activo sin número de serie", async () => {
    const activoSinNumeroSerie = {
      clienteId: 1,
      numSerie: "",
      descripcion: null,
      modeloMaquinaId: 1,
      anioFabricacion: null,
      nombre: "Excavadora 02",
      ubicacion: null,
    };

    await expect(crearActivo(activoSinNumeroSerie)).rejects.toThrow("El número de serie es obligatorio.");
  });

  it("da de baja un activo sin eliminarlo", async () => {
    const activo = await desactivarActivo(1);

    expect(activo.estado).toBe("inactivo");
  });
});
