import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aUrlInternaKeycloak,
  construirUrlCierreKeycloak,
  fetchKeycloak,
  leerRolesDelToken,
  necesitaRenovarse,
  renovarTokens,
} from "@/seguridad/keycloak";

/** JWT sin firma, suficiente para leer la carga. */
function tokenCon(carga: object) {
  return ["e30", Buffer.from(JSON.stringify(carga)).toString("base64url"), "firma"].join(".");
}

beforeEach(() => {
  vi.stubEnv("KEYCLOAK_EMISOR", "http://localhost:9080/realms/sotra");
  vi.stubEnv("KEYCLOAK_URL_INTERNA", "http://host.docker.internal:9080");
  vi.stubEnv("KEYCLOAK_CLIENTE", "sotra-frontend");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Keycloak dentro de Docker", () => {
  it("los pedidos de servidor a servidor van a la dirección interna; el resto no cambia", () => {
    expect(aUrlInternaKeycloak("http://localhost:9080/realms/sotra/.well-known/openid-configuration")).toBe(
      "http://host.docker.internal:9080/realms/sotra/.well-known/openid-configuration",
    );
    expect(aUrlInternaKeycloak("http://otro:9080/x")).toBe("http://otro:9080/x");
    vi.stubEnv("KEYCLOAK_URL_INTERNA", "");
    expect(aUrlInternaKeycloak("http://localhost:9080/realms/sotra/x")).toBe("http://localhost:9080/realms/sotra/x");
  });

  it("fetchKeycloak (el customFetch de Auth.js) reescribe la dirección", async () => {
    const fetchSimulado = vi.fn(async () => new Response("{}"));
    vi.stubGlobal("fetch", fetchSimulado);
    await fetchKeycloak("http://localhost:9080/realms/sotra/protocol/openid-connect/token", { method: "POST" });
    expect(fetchSimulado).toHaveBeenCalledWith("http://host.docker.internal:9080/realms/sotra/protocol/openid-connect/token", { method: "POST" });
  });
});

describe("roles del token", () => {
  it("lee realm_access.roles y deja solo los de SOTRA", () => {
    expect(leerRolesDelToken(tokenCon({ realm_access: { roles: ["offline_access", "jefe_mantenimiento"] } }))).toEqual(["jefe_mantenimiento"]);
  });

  it("un token ilegible o sin roles no da roles", () => {
    expect(leerRolesDelToken(undefined)).toEqual([]);
    expect(leerRolesDelToken("no-es-un-jwt")).toEqual([]);
    expect(leerRolesDelToken(tokenCon({}))).toEqual([]);
  });
});

describe("renovación del token de acceso", () => {
  it("se renueva un minuto antes de vencer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T12:00:00Z"));
    const ahora = Math.floor(Date.now() / 1000);
    expect(necesitaRenovarse({ venceEn: ahora + 120 })).toBe(false);
    expect(necesitaRenovarse({ venceEn: ahora + 59 })).toBe(true);
    expect(necesitaRenovarse({})).toBe(true);
  });

  it("pide un token nuevo con el refresh token, como cliente público, a la dirección interna", async () => {
    const tokenNuevo = tokenCon({ realm_access: { roles: ["tecnico"] } });
    const fetchSimulado = vi.fn(async () => Response.json({ access_token: tokenNuevo, refresh_token: "r2", id_token: "i2", expires_in: 300 }));
    vi.stubGlobal("fetch", fetchSimulado);

    const renovados = await renovarTokens({ tokenAcceso: "viejo", tokenRenovacion: "r1", tokenId: "i1", venceEn: 1 });

    const [url, opciones] = fetchSimulado.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://host.docker.internal:9080/realms/sotra/protocol/openid-connect/token");
    expect(Object.fromEntries(opciones.body as URLSearchParams)).toEqual({
      grant_type: "refresh_token",
      client_id: "sotra-frontend",
      refresh_token: "r1",
    });
    expect(renovados).toMatchObject({ tokenAcceso: tokenNuevo, tokenRenovacion: "r2", tokenId: "i2", roles: ["tecnico"], error: undefined });
    expect(renovados.venceEn).toBeGreaterThan(Date.now() / 1000 + 290);
  });

  it("si Keycloak rechaza la renovación (sesión vencida o cerrada) la marca con error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "invalid_grant" }, { status: 400 })));
    expect(await renovarTokens({ tokenRenovacion: "r1" })).toMatchObject({ error: "RenovacionFallida" });
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("red"))));
    expect(await renovarTokens({ tokenRenovacion: "r1" })).toMatchObject({ error: "RenovacionFallida" });
    expect(await renovarTokens({})).toMatchObject({ error: "RenovacionFallida" });
  });
});

describe("cierre de sesión en Keycloak", () => {
  it("usa id_token_hint y vuelve a la página principal (por el navegador, con la dirección pública)", () => {
    const url = new URL(construirUrlCierreKeycloak("id-token", "http://localhost/"));
    expect(url.origin + url.pathname).toBe("http://localhost:9080/realms/sotra/protocol/openid-connect/logout");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      id_token_hint: "id-token",
      client_id: "sotra-frontend",
      post_logout_redirect_uri: "http://localhost/",
    });
  });
});
