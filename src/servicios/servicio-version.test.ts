import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerVersionSistema } from "@/servicios/servicio-version";

describe("servicio-version", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ version: "1.0.3" }), {
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

  it("obtiene la versión del sistema desde el backend", async () => {
    const version = await obtenerVersionSistema();

    expect(version).toBe("1.0.3");
    expect(fetch).toHaveBeenCalledWith("/api/v1/version", expect.objectContaining({ cache: "no-store" }));
  });
});
