import NextAuth, { customFetch } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import {
  fetchKeycloak,
  leerRolesDelToken,
  necesitaRenovarse,
  obtenerClienteKeycloak,
  obtenerEmisorKeycloak,
  renovarTokens,
  usaCookiesSeguras,
  type TokensSesion,
} from "@/seguridad/keycloak";
import type { RolSotra } from "@/seguridad/permisos";

declare module "next-auth" {
  interface Session {
    roles: RolSotra[];
    error?: TokensSesion["error"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tokenAcceso?: string;
    tokenRenovacion?: string;
    tokenId?: string;
    venceEn?: number;
    roles?: RolSotra[];
    error?: TokensSesion["error"];
  }
}

/** Duración máxima de la sesión de Keycloak (`ssoSessionMaxLifespan` del realm): 10 horas. */
const DURACION_SESION_SEGUNDOS = 10 * 60 * 60;

/**
 * Sesión del lado del servidor: Authorization Code con PKCE (S256) contra el cliente público `sotra-frontend`.
 * Los tokens quedan en la cookie de sesión de Auth.js (JWT cifrado). El callback `jwt` los renueva antes de que venzan;
 * corre en el proxy (`src/proxy.ts`) en cada navegación, Server Action y pedido a `/api/v1`, que guarda la cookie nueva.
 * La configuración se arma en cada pedido (no al importar) para que `next build` no necesite las variables de Keycloak.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  providers: [
    Keycloak({
      issuer: obtenerEmisorKeycloak(),
      clientId: obtenerClienteKeycloak(),
      client: { token_endpoint_auth_method: "none" },
      checks: ["pkce", "state"],
      authorization: { params: { scope: "openid profile email" } },
      [customFetch]: fetchKeycloak,
    }),
  ],
  session: { strategy: "jwt", maxAge: DURACION_SESION_SEGUNDOS },
  // Errores del inicio de sesión (por ejemplo, volver con «Atrás» a la pantalla de Keycloak ya usada): pantalla propia.
  pages: { error: "/login/error" },
  useSecureCookies: usaCookiesSeguras(),
  trustHost: true,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          tokenAcceso: account.access_token,
          tokenRenovacion: account.refresh_token,
          tokenId: account.id_token,
          venceEn: account.expires_at,
          roles: leerRolesDelToken(account.access_token),
          error: undefined,
        };
      }
      if (token.error || !necesitaRenovarse(token)) return token;
      return renovarTokens(token);
    },
    /** Lo que ve `auth()`: nombre, correo, roles y si la renovación falló. Los tokens no salen de la cookie. */
    async session({ session, token }) {
      session.roles = token.roles ?? [];
      session.error = token.error;
      return session;
    },
  },
}));
