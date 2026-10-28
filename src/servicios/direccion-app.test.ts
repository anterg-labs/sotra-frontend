import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerDireccionParaApp } from "./direccion-app";

afterEach(() => vi.unstubAllGlobals());
describe("dirección para el celular", () => {
  it("cambia localhost por la IP del host y conserva puerto, ruta y parámetros", async () => {
    const fetchSimulado = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ipLocal: "192.168.1.47" }) });
    vi.stubGlobal("fetch", fetchSimulado);
    expect(await obtenerDireccionParaApp("http://localhost:3000/inicio?a=1#app")).toBe("http://192.168.1.47:3000/inicio?a=1#app");
  });
  it("conserva los dominios de staging y producción sin consultar la red local", async () => {
    const consulta = vi.fn(); vi.stubGlobal("fetch", consulta);
    for (const host of ["https://staging.example.test/inicio", "https://example.test/inicio"]) expect(await obtenerDireccionParaApp(host)).toBe(host);
    expect(consulta).not.toHaveBeenCalled();
  });
  it("rechaza una dirección local no disponible en vez de generar localhost", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(obtenerDireccionParaApp("http://localhost/inicio")).rejects.toThrow(/IP de red/);
  });
});
