import "server-only";
import { getToken, type JWT } from "next-auth/jwt";
import { headers } from "next/headers";
import { cache } from "react";
import { necesitaRenovarse, renovarTokens, usaCookiesSeguras } from "@/seguridad/keycloak";

/** Contenido de la cookie de sesión (descifrado) del pedido en curso, o `null` sin sesión. */
export async function leerTokensSesion(): Promise<JWT | null> {
  return getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    secureCookie: usaCookiesSeguras(),
  });
}

/**
 * Token de acceso para pedir a la API desde el servidor de Next, o `null` si no hay sesión válida.
 * Normalmente ya viene renovado por el proxy; si en este mismo pedido está por vencer (el proxy lo acaba de renovar
 * y la cookie nueva todavía no llegó), se renueva acá sin guardarlo. Una vez por pedido (`cache`).
 */
export const obtenerTokenAcceso = cache(async (): Promise<string | null> => {
  const tokens = await leerTokensSesion();
  if (!tokens || tokens.error || !tokens.tokenAcceso) return null;
  if (!necesitaRenovarse(tokens)) return tokens.tokenAcceso;

  const renovados = await renovarTokens(tokens);
  return renovados.error ? null : (renovados.tokenAcceso ?? null);
});
