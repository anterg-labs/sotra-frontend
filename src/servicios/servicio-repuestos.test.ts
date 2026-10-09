import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearRepuesto, desactivarRepuesto, listarRepuestos, tieneBajoStock } from "@/servicios/servicio-repuestos";

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

        const paginaSimulada = {
          elementos: [crearRepuestoSimulado("activo")],
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

  it("detecta el stock insuficiente solo en repuestos activos", () => {
    const repuestoBajo = {
      id: 1,
      codigo: "FIL-ACE-001",
      nombre: "Filtro de aceite",
      descripcion: "",
      marca: "Komatsu",
      ubicacion: "Pañol A",
      cantidad: 2,
      cantidadMinima: 2,
      estado: "activo" as const,
    };
    expect(tieneBajoStock(repuestoBajo)).toBe(true);

    const repuestoInactivo = {
      id: 2,
      codigo: "FIL-AIR-001",
      nombre: "Filtro de aire",
      descripcion: "",
      marca: "Komatsu",
      ubicacion: "Pañol A",
      cantidad: 0,
      cantidadMinima: 5,
      estado: "inactivo" as const,
    };
    expect(tieneBajoStock(repuestoInactivo)).toBe(false);
  });
});
