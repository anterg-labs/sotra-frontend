import { afterEach, describe, expect, it, vi } from "vitest";
import { enviarPedidoApi, ErrorDeApi, TIEMPO_ESPERA_PEDIDO_MS, TIEMPO_ESPERA_SUBIDA_MS } from "./solicitudes-http";

describe("errores de la API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("conserva el código y el mensaje estable de un conflicto", async () => {
    vi.stubEnv("API_URL", "http://localhost:8081");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ codigo: "TELEFONO_DUPLICADO", mensaje: "El teléfono ya está registrado." }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    )));

    await expect(enviarPedidoApi("/api/v1/clientes", { method: "POST" }, "Error genérico"))
      .rejects.toEqual(new ErrorDeApi("El teléfono ya está registrado.", "TELEFONO_DUPLICADO", 409));
  });

  it("convierte un corte de red o una espera agotada en un error de API no disponible", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(enviarPedidoApi("/api/v1/clientes", { method: "GET" }, "No se pudo cargar."))
      .rejects.toEqual(new ErrorDeApi("No se pudo cargar.", "API_NO_DISPONIBLE", 503));
  });

  it("propaga la cancelación pedida por quien llama, sin convertirla en un error de API", async () => {
    const controlador = new AbortController();
    const cancelacion = new DOMException("Cancelado", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      controlador.abort();
      throw cancelacion;
    }));

    await expect(enviarPedidoApi("/api/v1/clientes", { signal: controlador.signal }, "No se pudo cargar."))
      .rejects.toBe(cancelacion);
  });

  it("da más tiempo a las subidas de archivos que a una consulta", async () => {
    const espera = vi.spyOn(AbortSignal, "timeout");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));

    await enviarPedidoApi("/api/v1/clientes", { method: "GET" }, "x");
    await enviarPedidoApi("/api/v1/ordenes-trabajo/1/evidencias", { method: "POST", body: new FormData() }, "x");

    expect(espera).toHaveBeenNthCalledWith(1, TIEMPO_ESPERA_PEDIDO_MS);
    expect(espera).toHaveBeenNthCalledWith(2, TIEMPO_ESPERA_SUBIDA_MS);
    espera.mockRestore();
  });
});
