// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const manejadores = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
vi.mock("@/auth", () => ({ handlers: manejadores }));
const registrarFalloSesion = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/servidor/registro-fallo-sesion", () => ({ registrarFalloSesion }));
beforeEach(() => {
  manejadores.GET.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
  manejadores.POST.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
  registrarFalloSesion.mockReset();
});

describe("origen público del callback de sesión", () => {
  it.each(["localhost", "192.168.1.47", "staging.sotra.test:8443"])("conserva %s frente al puerto interno", async (host) => {
    const solicitud = new NextRequest("http://localhost:3000/api/auth/callback/keycloak?code=prueba", {
      headers: { host, "x-forwarded-host": host, "x-forwarded-proto": "https", cookie: "prueba=valor" },
    });
    GET(solicitud);
    const recibida = manejadores.GET.mock.lastCall![0] as NextRequest;
    expect(recibida.url).toBe(`https://${host}/api/auth/callback/keycloak?code=prueba`);
    expect(recibida.headers.get("cookie")).toBe("prueba=valor");
  });

  it("conserva el cuerpo de POST y usa Host cuando no hay proxy", async () => {
    POST(new NextRequest("http://localhost:3000/api/auth/signout", {
      method: "POST", headers: { host: "sotra.test", "content-type": "application/x-www-form-urlencoded" },
      body: "csrfToken=prueba",
    }));
    const recibida = manejadores.POST.mock.lastCall![0] as NextRequest;
    expect(recibida.url).toBe("http://sotra.test/api/auth/signout");
    expect(await recibida.text()).toBe("csrfToken=prueba");
  });

  it("registra un callback de login que termina en la pantalla de error", async () => {
    manejadores.GET.mockResolvedValue(new Response(null, { status: 302,
      headers: { location: "http://192.168.1.47/login/error?error=Configuration" } }));
    await GET(new NextRequest("http://192.168.1.47/api/auth/callback/keycloak"));
    expect(registrarFalloSesion).toHaveBeenCalledWith("AUTH_CALLBACK_ERROR", 302);
  });
});
