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

describe("reintento automático del login", () => {
  const errorDeCallback = () => new Response(null, { status: 302, headers: {
    location: "https://sotra.test/login/error?error=Configuration",
    "set-cookie": "__Secure-authjs.state=; Path=/; Max-Age=0",
  } });

  function callback(cookies = "") {
    return GET(new NextRequest("https://sotra.test/api/auth/callback/keycloak?code=viejo&state=viejo", {
      headers: cookies ? { cookie: cookies } : {},
    }));
  }

  it("la primera falla vuelve al login con la página pedida y marca el reintento", async () => {
    manejadores.GET.mockResolvedValue(errorDeCallback());
    const respuesta = await callback("__Secure-authjs.callback-url=https%3A%2F%2Fsotra.test%2Factivos%3Fpagina%3D2");
    expect(respuesta.headers.get("location")).toBe("https://sotra.test/login?destino=%2Factivos%3Fpagina%3D2");
    const cookies = respuesta.headers.getSetCookie();
    expect(cookies).toContain("__Secure-authjs.state=; Path=/; Max-Age=0");
    expect(cookies.some((c) => c.startsWith("sotra-reintento-login=1;") && c.includes("Path=/api/auth"))).toBe(true);
  });

  it("sin página pedida, o con una externa, vuelve al inicio", async () => {
    manejadores.GET.mockResolvedValue(errorDeCallback());
    const respuesta = await callback("authjs.callback-url=https%3A%2F%2Fotro.test%2F%2Fmalo");
    expect(respuesta.headers.get("location")).toBe("https://sotra.test/login?destino=%2F");
  });

  it("si ya se reintentó, muestra la pantalla de error y borra la marca", async () => {
    manejadores.GET.mockResolvedValue(errorDeCallback());
    const respuesta = await callback("sotra-reintento-login=1");
    expect(respuesta.headers.get("location")).toBe("https://sotra.test/login/error?error=Configuration");
    expect(respuesta.headers.getSetCookie().some((c) => c.startsWith("sotra-reintento-login=;") && c.includes("Max-Age=0"))).toBe(true);
  });

  it("otros errores no se reintentan", async () => {
    manejadores.GET.mockResolvedValue(new Response(null, { status: 302,
      headers: { location: "https://sotra.test/login/error?error=AccessDenied" } }));
    const respuesta = await callback();
    expect(respuesta.headers.get("location")).toBe("https://sotra.test/login/error?error=AccessDenied");
  });

  it("un login que termina bien borra la marca", async () => {
    manejadores.GET.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://sotra.test/" } }));
    const respuesta = await callback("sotra-reintento-login=1");
    expect(respuesta.headers.get("location")).toBe("https://sotra.test/");
    expect(respuesta.headers.getSetCookie().some((c) => c.startsWith("sotra-reintento-login=;"))).toBe(true);
  });
});
