import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Estas pruebas usan el token y la sesión reales (vitest.setup.ts los simula para el resto).
vi.unmock("@/servicios/servidor/token-acceso");
vi.unmock("@/servicios/servidor/sesion");

const getToken = vi.hoisted(() => vi.fn());
const encabezados = vi.hoisted(() => ({ valor: new Headers() }));
const redirect = vi.hoisted(() =>
  vi.fn((destino: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { destino });
  }),
);

vi.mock("next-auth/jwt", () => ({ getToken }));
const registrarFalloSesion = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/servidor/registro-fallo-sesion", () => ({ registrarFalloSesion }));
vi.mock("next/headers", () => ({ headers: async () => encabezados.valor }));
vi.mock("next/navigation", () => ({ redirect, unstable_rethrow: (error: unknown) => {
  if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
} }));

const { obtenerTokenAcceso } = await import("@/servicios/servidor/token-acceso");
const { obtenerEstadoSesion, tienePermisoServidor } = await import("@/servicios/servidor/sesion");
const { leerJsonServidor, solicitarApiServidor } = await import("@/servicios/servidor/cliente-http-servidor");

const enUnRato = () => Math.floor(Date.now() / 1000) + 300;
let fetchSimulado: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("API_URL_INTERNA", "http://api.test");
  vi.stubEnv("AUTH_SECRET", "secreto");
  vi.stubEnv("KEYCLOAK_EMISOR", "http://localhost:9080/realms/sotra");
  encabezados.valor = new Headers({ "x-sotra-ruta": "/ordenes-trabajo?pagina=2" });
  getToken.mockReset();
  redirect.mockClear();
  registrarFalloSesion.mockReset();
  fetchSimulado = vi.fn();
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("token de acceso del servidor", () => {
  it("lee la cookie de sesión del pedido con AUTH_SECRET y devuelve el token vigente", async () => {
    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    expect(await obtenerTokenAcceso()).toBe("tok");
    expect(getToken).toHaveBeenCalledWith(expect.objectContaining({ secret: "secreto", secureCookie: false }));
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("sin cookie o con la renovación fallida no hay token", async () => {
    getToken.mockResolvedValue(null);
    expect(await obtenerTokenAcceso()).toBeNull();
    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato(), error: "RenovacionFallida" });
    expect(await obtenerTokenAcceso()).toBeNull();
  });

  it("si está por vencer lo renueva en el momento con el refresh token", async () => {
    getToken.mockResolvedValue({ tokenAcceso: "viejo", tokenRenovacion: "r1", venceEn: 10 });
    fetchSimulado.mockResolvedValue(Response.json({ access_token: "nuevo", refresh_token: "r2", expires_in: 300 }));
    expect(await obtenerTokenAcceso()).toBe("nuevo");
    fetchSimulado.mockResolvedValue(Response.json({ error: "invalid_grant" }, { status: 400 }));
    expect(await obtenerTokenAcceso()).toBeNull();
  });
});

describe("pedidos del servidor a la API", () => {
  it("envían el token en Authorization y conservan los demás encabezados", async () => {
    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    fetchSimulado.mockResolvedValue(Response.json({ ok: true }));
    await leerJsonServidor("/api/v1/clientes", "x", { method: "POST", headers: { "Content-Type": "application/json" } });
    const [url, opciones] = fetchSimulado.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/api/v1/clientes");
    const enviados = new Headers(opciones.headers);
    expect(enviados.get("Authorization")).toBe("Bearer tok");
    expect(enviados.get("Content-Type")).toBe("application/json");
  });

  it("sin sesión, o si la API responde 401, vuelven al login con la página pedida", async () => {
    getToken.mockResolvedValue(null);
    await expect(solicitarApiServidor("/api/v1/clientes", {}, "x")).rejects.toMatchObject({ destino: "/login?destino=%2Fordenes-trabajo%3Fpagina%3D2" });
    expect(fetchSimulado).not.toHaveBeenCalled();

    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    fetchSimulado.mockResolvedValue(new Response(null, { status: 401 }));
    await expect(solicitarApiServidor("/api/v1/clientes", {}, "x")).rejects.toMatchObject({ message: "NEXT_REDIRECT" });
  });

  it("un 403 (sin cuerpo) se traduce a «No tenés permiso para realizar esta acción.»", async () => {
    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    fetchSimulado.mockResolvedValue(new Response(null, { status: 403 }));
    await expect(solicitarApiServidor("/api/v1/usuarios", {}, "x")).rejects.toMatchObject({
      message: "No tenés permiso para realizar esta acción.",
      codigo: "SIN_PERMISO",
      estadoHttp: 403,
    });
  });
});

describe("usuario en sesión (/api/v1/sesion)", () => {
  const respuestaSesion = (cambios: object) =>
    Response.json({ idKeycloak: "abc", idUsuario: 30, correo: "tecnico.prueba@sotra.test", nombre: "Técnico Prueba", roles: ["tecnico"], ...cambios });

  it("con usuario de SOTRA y un rol tiene acceso; los permisos salen de sus roles", async () => {
    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    fetchSimulado.mockImplementation(async () => respuestaSesion({}));
    expect(await obtenerEstadoSesion()).toEqual({
      estado: "con-acceso",
      usuario: { idKeycloak: "abc", idUsuario: 30, correo: "tecnico.prueba@sotra.test", nombre: "Técnico Prueba", roles: ["tecnico"] },
    });
    expect(fetchSimulado.mock.calls[0][0]).toBe("http://api.test/api/v1/sesion");
    expect(await tienePermisoServidor("ot.registrar_avance")).toBe(true);
    expect(await tienePermisoServidor("stock.consultar")).toBe(false);
  });

  it("sin fila en SOTRA (idUsuario null) o sin roles de SOTRA: sin acceso", async () => {
    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    fetchSimulado.mockResolvedValueOnce(respuestaSesion({ idUsuario: null }));
    expect((await obtenerEstadoSesion()).estado).toBe("sin-acceso");
    fetchSimulado.mockResolvedValueOnce(respuestaSesion({ roles: ["offline_access"] }));
    expect((await obtenerEstadoSesion()).estado).toBe("sin-acceso");
  });

  it("recupera la sesión cuando la API vuelve tras una falla temporal", async () => {
    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    fetchSimulado.mockResolvedValueOnce(new Response(null, { status: 503 }));
    fetchSimulado.mockResolvedValueOnce(respuestaSesion({}));
    expect((await obtenerEstadoSesion()).estado).toBe("con-acceso");
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
  });

  it("no reintenta una respuesta 403", async () => {
    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    fetchSimulado.mockResolvedValue(new Response(null, { status: 403 }));
    expect(await obtenerEstadoSesion()).toEqual({ estado: "error" });
    expect(fetchSimulado).toHaveBeenCalledTimes(1);
  });

  it("sin cookie no consulta la API; si la API falla, informa el error", async () => {
    getToken.mockResolvedValue(null);
    expect(await obtenerEstadoSesion()).toEqual({ estado: "sin-sesion" });
    expect(fetchSimulado).not.toHaveBeenCalled();

    getToken.mockResolvedValue({ tokenAcceso: "tok", venceEn: enUnRato() });
    fetchSimulado.mockResolvedValue(Response.json({ mensaje: "x" }, { status: 500 }));
    expect(await obtenerEstadoSesion()).toEqual({ estado: "error" });
    expect(fetchSimulado).toHaveBeenCalledTimes(3);
    expect(registrarFalloSesion).toHaveBeenCalledWith("SESION_API_ERROR", 500);
    expect(await tienePermisoServidor("ot.consultar")).toBe(false);
  });
});
