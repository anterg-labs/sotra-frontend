import { handlers } from "@/auth";
import { NextRequest } from "next/server";
import { registrarFalloSesion } from "@/servicios/servidor/registro-fallo-sesion";

/** Usa el mismo origen que Auth.js al iniciar el login, incluido el puerto público de Docker. */
function conOrigenPublico(solicitud: NextRequest): NextRequest {
  const original = new URL(solicitud.url);
  const host = solicitud.headers.get("x-forwarded-host") ?? solicitud.headers.get("host");
  const protocolo = solicitud.headers.get("x-forwarded-proto");
  const esquema = protocolo === "http" || protocolo === "https" ? protocolo + ":" : original.protocol;
  const direccion = new URL(original.pathname + original.search, host ? `${esquema}//${host}` : original.origin);
  return new NextRequest(new Request(direccion, solicitud));
}

async function ejecutar(solicitud: NextRequest, metodo: "GET" | "POST") {
  try {
    const respuesta = await handlers[metodo](conOrigenPublico(solicitud));
    const destino = respuesta.headers.get("location");
    if (destino && new URL(destino, solicitud.url).pathname === "/login/error") {
      await registrarFalloSesion("AUTH_CALLBACK_ERROR", respuesta.status);
    }
    return respuesta;
  } catch (error) {
    await registrarFalloSesion("AUTH_CALLBACK_ERROR");
    throw error;
  }
}

export function GET(solicitud: NextRequest) {
  return ejecutar(solicitud, "GET");
}

export function POST(solicitud: NextRequest) {
  return ejecutar(solicitud, "POST");
}
