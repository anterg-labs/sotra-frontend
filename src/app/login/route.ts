import type { NextRequest } from "next/server";
import { signIn } from "@/auth";
import { esDestinoInterno } from "@/servicios/api/solicitudes-http";

/**
 * Inicio de sesión: manda directo a la pantalla de Keycloak y, al volver, a `destino` (la página que se había pedido).
 * La recuperación de contraseña también es de Keycloak («¿Has olvidado tu contraseña?»).
 */
export async function GET(solicitud: NextRequest) {
  const destino = solicitud.nextUrl.searchParams.get("destino");
  await signIn("keycloak", { redirectTo: esDestinoInterno(destino) ? destino : "/" });
}
