import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearRepuesto, desactivarRepuesto, listarRepuestos } from "@/servicios/servicio-repuestos";

describe("servicio-repuestos", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    function crearRepuestoSimulado(estado: string) {
      return {
        id: 1,
        codigo: "FIL-ACE-001",
        nombre: "Filtro de aceite del motor",
        descripcion: "",
        marca: "Komatsu",
        ubicacion: "Pañol A",
        cantidad: 12,
        cantidadMinima: 4,
        estado: estado,
      };
    }

    vi.stubGlobal(
      "fetch",
      vi.fn(async (entrada: string | URL | Request, opciones?: RequestInit) => {
        if (opciones && opciones.method === "PATCH") {
          return new Response(JSON.stringify(crearRepuestoSimulado("inactivo")), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify([crearRepuestoSimulado("activo")]), {
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

  it("obtiene el listado de repuestos", async () => {
    const respuesta = await listarRepuestos();

    expect(respuesta).toHaveLength(1);
    expect(respuesta[0].codigo).toBe("FIL-ACE-001");
  });

  it("no permite crear un repuesto sin código", async () => {
    const repuestoSinCodigo = {
      codigo: "",
      nombre: "Filtro",
      descripcion: "",
      marca: "",
      ubicacion: "",
      cantidad: 1,
      cantidadMinima: 0,
    };

    await expect(crearRepuesto(repuestoSinCodigo)).rejects.toThrow("El código del repuesto es obligatorio.");
  });

  it("no permite una cantidad negativa", async () => {
    const repuestoConCantidadNegativa = {
      codigo: "FIL-001",
      nombre: "Filtro",
      descripcion: "",
      marca: "",
      ubicacion: "",
      cantidad: -1,
      cantidadMinima: 0,
    };

    await expect(crearRepuesto(repuestoConCantidadNegativa)).rejects.toThrow("La cantidad debe ser un número entero");
  });

  it("da de baja un repuesto sin eliminarlo", async () => {
    const repuesto = await desactivarRepuesto(1);

    expect(repuesto.estado).toBe("inactivo");
  });
});
