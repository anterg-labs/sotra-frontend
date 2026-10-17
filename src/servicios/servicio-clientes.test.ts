import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listarClientesPaginados, obtenerDetalleCliente } from "@/servicios/servicio-clientes";

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
      vi.fn(async (entrada: string | URL | Request) => {
        const url = String(entrada);

        if (url.endsWith("/clientes/9999")) {
          return new Response(null, { status: 404 });
        }

        if (url.endsWith("/clientes/1")) {
          return Response.json(clientesSimulados[0]);
        }

        return Response.json({ elementos: clientesSimulados, pagina: 1, tamanoPagina: 20, totalElementos: 1, totalPaginas: 1 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("obtiene el listado paginado de clientes", async () => {
    const respuesta = await listarClientesPaginados({ buscar: "", estado: "", pagina: 1 });

    expect(respuesta.elementos).toHaveLength(1);
    expect(respuesta.elementos[0].razonSocial).toBe("Vialidad Norte");
  });

  it("obtiene el detalle de un cliente", async () => {
    const cliente = await obtenerDetalleCliente(1);

    expect(cliente.razonSocial).toBe("Vialidad Norte");
  });

  it("devuelve un error cuando el cliente no existe", async () => {
    await expect(obtenerDetalleCliente(9999)).rejects.toThrow("No se pudo obtener el cliente solicitado.");
  });
});
