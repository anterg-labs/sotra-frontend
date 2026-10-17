import { afterEach, describe, expect, it, vi } from "vitest";
import { enviarPedidoApi, ErrorDeApi } from "./solicitudes-http";

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
});
