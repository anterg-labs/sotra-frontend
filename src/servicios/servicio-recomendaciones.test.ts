import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listarRecomendaciones, validarRecomendacion } from "@/servicios/servicio-recomendaciones";

describe("servicio-recomendaciones", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const recomendacionSimulada = {
      id: 8,
      texto: "Usar guantes",
      estadoValidacion: "pendiente",
      validaciones: [],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify([recomendacionSimulada]), {
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

  it("obtiene las recomendaciones de una orden", async () => {
    const recomendaciones = await listarRecomendaciones(6);

    expect(recomendaciones[0].estadoValidacion).toBe("pendiente");
    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/api/v1/ordenes-trabajo/6/sugerencias", { cache: "no-store" });
  });

  it("pide el motivo para rechazar", async () => {
    await expect(validarRecomendacion(6, 8, "rechazada", " ")).rejects.toThrow("Indicá el motivo del rechazo.");
  });

  it("pide el texto para observar", async () => {
    await expect(validarRecomendacion(6, 8, "observada", "")).rejects.toThrow(
      "Escribí la observación sobre la recomendación.",
    );
  });

  it("envía la aceptación", async () => {
    await validarRecomendacion(6, 8, "aceptada", "");

    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/api/v1/ordenes-trabajo/6/sugerencias/8/validaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultado: "aceptada", observacion: "" }),
    });
  });
});
