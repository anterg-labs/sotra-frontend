import { NextResponse, type NextRequest } from "next/server";
import { signOut } from "@/auth";
import { construirUrlCierreKeycloak } from "@/seguridad/keycloak";
import { leerTokensSesion } from "@/servicios/servidor/token-acceso";

/**
 * Cierre de sesión (POST, para que otro sitio no pueda cerrarla con un enlace): borra la cookie de sesión y manda al
 * logout de Keycloak con `id_token_hint`, que termina también la sesión SSO y vuelve a la página principal.
 * Sin cerrar la de Keycloak, el próximo login entraría sin pedir la contraseña.
 */
export async function POST(solicitud: NextRequest) {
  const tokens = await leerTokensSesion();
  await signOut({ redirect: false });
  const origen = solicitud.headers.get("origin") || process.env.AUTH_URL || "http://localhost";
  return NextResponse.redirect(construirUrlCierreKeycloak(tokens?.tokenId, origen.replace(/\/$/, "") + "/"), 303);
}
