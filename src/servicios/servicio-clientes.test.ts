import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { desactivarCliente, listarClientes, obtenerDetalleCliente } from "@/servicios/servicio-clientes";

describe("servicio-clientes", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const clientesSimulados = [
      {
        id: 1,
        razonSocial: "Vialidad Norte",
        nombreContacto: "Jorge Martínez",
        correo: "operaciones@vialidadnorte.com",
        telefono: "+598 4732 2002",
        direccion: "Artigas 820, Salto",
        observaciones: "",
        cantidadActivosAsociados: 0,
        estado: "activo",
        creadoEn: "2026-08-12T09:30:00Z",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (entrada: string | URL | Request, opciones?: RequestInit) => {
        const url = String(entrada);

        if (url.endsWith("/clientes/9999")) {
          return new Response(null, { status: 404 });
        }

        if (opciones && opciones.method === "PATCH") {
          const clienteDesactivado = {
            ...clientesSimulados[0],
            estado: "inactivo",
          };

          return new Response(JSON.stringify(clienteDesactivado), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const paginaSimulada = {
          elementos: clientesSimulados,
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

  it("obtiene el listado de clientes", async () => {
    const respuesta = await listarClientes();

    expect(respuesta).toHaveLength(1);
    expect(respuesta[0].razonSocial).toBe("Vialidad Norte");
  });

  it("devuelve un error cuando el cliente no existe", async () => {
    await expect(obtenerDetalleCliente(9999)).rejects.toThrow("No se pudo obtener el cliente solicitado.");
  });

  it("da de baja un cliente sin eliminarlo", async () => {
    const cliente = await desactivarCliente(1);

    expect(cliente.estado).toBe("inactivo");
  });
});
