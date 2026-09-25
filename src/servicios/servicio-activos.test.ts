import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearActivo, desactivarActivo, listarActivos } from "@/servicios/servicio-activos";

describe("servicio-activos", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const activosSimulados = [
      {
        id: 1,
        nombre: "Excavadora 01",
        numeroSerie: "CAT320D-0001",
        descripcion: "",
        estado: "activo",
        clienteId: 1,
        nombreCliente: "Constructora del Sur",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (entrada: string | URL | Request, opciones?: RequestInit) => {
        if (opciones && opciones.method === "PATCH") {
          const activoDesactivado = {
            id: 1,
            nombre: "Excavadora 01",
            numeroSerie: "CAT320D-0001",
            descripcion: "",
            estado: "inactivo",
            clienteId: 1,
            nombreCliente: "Constructora del Sur",
          };

          return new Response(JSON.stringify(activoDesactivado), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(activosSimulados), {
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
  });

  it("no permite crear un activo sin número de serie", async () => {
    const activoSinNumeroSerie = {
      nombre: "Excavadora 02",
      numeroSerie: "",
      descripcion: "",
      clienteId: 1,
    };

    await expect(crearActivo(activoSinNumeroSerie)).rejects.toThrow("El número de serie es obligatorio.");
  });

  it("da de baja un activo sin eliminarlo", async () => {
    const activo = await desactivarActivo(1);

    expect(activo.estado).toBe("inactivo");
  });
});
