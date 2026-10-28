import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { obtenerUrlBaseApiServidor } from "@/servicios/api/solicitudes-http";

type CodigoFallo = "SESION_API_NO_DISPONIBLE" | "SESION_API_ERROR" |
  "SESION_RESPUESTA_INVALIDA" | "AUTH_CALLBACK_ERROR" | "TOKEN_RENOVACION_FALLIDA";

/** Solo se transmiten códigos y estado; nunca errores libres ni datos de la cookie. */
export async function registrarFalloSesion(codigo: CodigoFallo, estadoHttp: number | null = null) {
  const evento = {
    Fecha: new Date().toISOString(), Origen: "frontend", Categoria: "sesion", Codigo: codigo,
    Excepcion: null, EstadoHttp: estadoHttp, Ruta: "/api/v1/sesion", IdCorrelacion: null,
  };
  try {
    const respuesta = await fetch(obtenerUrlBaseApiServidor() + "/api/v1/registro-errores/sesion", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, estadoHttp }), cache: "no-store", signal: AbortSignal.timeout(1500),
    });
    if (respuesta.ok) return;
  } catch { /* La API puede estar caída; se conserva el evento para reenvío. */ }

  try {
    const carpeta = process.env.SOTRA_ERROR_SPOOL_DIR ?? join(tmpdir(), "sotra-errores-pendientes");
    await mkdir(carpeta, { recursive: true });
    await writeFile(join(carpeta, `${Date.now()}-${randomUUID()}.json`), JSON.stringify(evento), { flag: "wx" });
  } catch { console.error("No se pudo conservar un fallo de sesión para su registro posterior."); }
}
