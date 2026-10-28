import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const simulados = vi.hoisted(() => ({ auth: vi.fn(), readFile: vi.fn() }));
vi.mock("@/auth", () => ({ auth: simulados.auth }));
vi.mock("node:fs/promises", () => ({ readFile: simulados.readFile, default: { readFile: simulados.readFile } }));
beforeEach(() => { simulados.auth.mockReset().mockResolvedValue({ user: {} }); simulados.readFile.mockReset(); });
describe("dirección local para QR", () => {
  it("exige sesión antes de leer la configuración del equipo", async () => {
    simulados.auth.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(simulados.readFile).not.toHaveBeenCalled();
  });
  it("devuelve la IP de red sin almacenarla en caché", async () => {
    simulados.readFile.mockResolvedValue('{"ipLocal":"192.168.1.47"}');
    const respuesta = await GET();
    expect(await respuesta.json()).toEqual({ ipLocal: "192.168.1.47" });
    expect(respuesta.headers.get("Cache-Control")).toBe("no-store");
  });
  it("no devuelve localhost ni detalles técnicos si falta una IP válida", async () => {
    simulados.readFile.mockResolvedValue('{"ipLocal":"127.0.0.1"}');
    const respuesta = await GET();
    expect(respuesta.status).toBe(503);
    expect((await respuesta.json()).mensaje).toContain("qr:actualizar-ip");
  });
});
