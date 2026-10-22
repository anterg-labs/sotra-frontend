import { filtrarRolesSotra, type RolSotra } from "@/seguridad/permisos";

/**
 * Datos de Keycloak para el servidor de Next.
 * - `KEYCLOAK_EMISOR`: emisor de los tokens y dirección pública (la que abre el navegador para el login).
 * - `KEYCLOAK_URL_INTERNA`: dirección por la que el servidor llega a Keycloak (dentro de Docker,
 *   `http://host.docker.internal:9080`). Los pedidos de servidor a servidor (descubrimiento, token, renovación)
 *   se reescriben a esta dirección; el emisor esperado sigue siendo `KEYCLOAK_EMISOR`.
 */
export function obtenerEmisorKeycloak(): string {
  const emisor = process.env.KEYCLOAK_EMISOR;
  if (!emisor) throw new Error("KEYCLOAK_EMISOR no está configurado.");
  return emisor.replace(/\/$/, "");
}

/** Con https la cookie de sesión se llama `__Secure-authjs.session-token`: Auth.js y `getToken` usan el mismo criterio. */
export function usaCookiesSeguras(): boolean {
  return (process.env.AUTH_URL ?? "").startsWith("https://");
}

export function obtenerClienteKeycloak(): string {
  return process.env.KEYCLOAK_CLIENTE || "sotra-frontend";
}

/** Cambia el origen público de Keycloak por el interno. Otras direcciones quedan igual. */
export function aUrlInternaKeycloak(url: string): string {
  const interna = process.env.KEYCLOAK_URL_INTERNA?.replace(/\/$/, "");
  if (!interna) return url;
  const origenPublico = new URL(obtenerEmisorKeycloak()).origin;
  return url.startsWith(origenPublico + "/") || url === origenPublico ? interna + url.slice(origenPublico.length) : url;
}

/** `fetch` para los pedidos de servidor a servidor a Keycloak. */
export function fetchKeycloak(entrada: string | URL | Request, opciones?: RequestInit): Promise<Response> {
  if (entrada instanceof Request) return fetch(new Request(aUrlInternaKeycloak(entrada.url), entrada), opciones);
  return fetch(aUrlInternaKeycloak(String(entrada)), opciones);
}

/** Roles de SOTRA del token de acceso (`realm_access.roles`). Solo lee: la firma la valida la API. */
export function leerRolesDelToken(tokenAcceso: string | undefined): RolSotra[] {
  if (!tokenAcceso) return [];
  try {
    const carga = tokenAcceso.split(".")[1];
    const datos = JSON.parse(Buffer.from(carga, "base64url").toString("utf8")) as { realm_access?: { roles?: unknown } };
    const roles = datos.realm_access?.roles;
    return Array.isArray(roles) ? filtrarRolesSotra(roles.filter((rol): rol is string => typeof rol === "string")) : [];
  } catch {
    return [];
  }
}

/** Tokens de la sesión. Viven solo en la cookie cifrada de Auth.js: nunca llegan al navegador. */
export type TokensSesion = {
  tokenAcceso?: string;
  tokenRenovacion?: string;
  tokenId?: string;
  /** Vencimiento del token de acceso, en segundos desde 1970. */
  venceEn?: number;
  roles?: RolSotra[];
  error?: "RenovacionFallida";
};

/** Margen para renovar antes del vencimiento: un pedido que sale con el token no llega vencido a la API. */
const MARGEN_RENOVACION_SEGUNDOS = 60;

export function necesitaRenovarse(tokens: TokensSesion, ahora = Date.now()): boolean {
  return typeof tokens.venceEn !== "number" || ahora >= (tokens.venceEn - MARGEN_RENOVACION_SEGUNDOS) * 1000;
}

/**
 * Pide un token de acceso nuevo con el refresh token (cliente público: sin secreto).
 * Si Keycloak lo rechaza (sesión vencida o cerrada), devuelve los tokens con `error` para volver a pedir el login.
 */
export async function renovarTokens<T extends TokensSesion>(tokens: T): Promise<T> {
  if (!tokens.tokenRenovacion) return { ...tokens, error: "RenovacionFallida" };
  try {
    const respuesta = await fetchKeycloak(obtenerEmisorKeycloak() + "/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: obtenerClienteKeycloak(),
        refresh_token: tokens.tokenRenovacion,
      }),
      cache: "no-store",
    });
    if (!respuesta.ok) return { ...tokens, error: "RenovacionFallida" };
    const datos = (await respuesta.json()) as { access_token: string; refresh_token?: string; id_token?: string; expires_in: number };
    return {
      ...tokens,
      tokenAcceso: datos.access_token,
      tokenRenovacion: datos.refresh_token ?? tokens.tokenRenovacion,
      tokenId: datos.id_token ?? tokens.tokenId,
      venceEn: Math.floor(Date.now() / 1000) + datos.expires_in,
      roles: leerRolesDelToken(datos.access_token),
      error: undefined,
    };
  } catch {
    return { ...tokens, error: "RenovacionFallida" };
  }
}

/** Dirección de cierre de sesión de Keycloak: termina la sesión SSO y vuelve a `alVolver`. */
export function construirUrlCierreKeycloak(tokenId: string | undefined, alVolver: string): string {
  const url = new URL(obtenerEmisorKeycloak() + "/protocol/openid-connect/logout");
  if (tokenId) url.searchParams.set("id_token_hint", tokenId);
  url.searchParams.set("client_id", obtenerClienteKeycloak());
  url.searchParams.set("post_logout_redirect_uri", alVolver);
  return url.toString();
}
