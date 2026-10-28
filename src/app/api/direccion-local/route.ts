import { readFile } from "node:fs/promises";
import { isIP } from "node:net";
import { auth } from "@/auth";

export const runtime = "nodejs";

/** Dirección de la red del host, generada por su arranque local. Nunca devuelve una IP de la red interna de Docker. */
export async function GET() {
  const sesion = await auth();
  if (!sesion || sesion.error) return Response.json({ mensaje: "Se requiere una sesión." }, { status: 401 });
  try {
    const archivo: unknown = JSON.parse(await readFile(".ip-local.json", "utf8"));
    if (typeof archivo === "object" && archivo !== null && "ipLocal" in archivo && typeof archivo.ipLocal === "string"
      && isIP(archivo.ipLocal) === 4 && !archivo.ipLocal.startsWith("127.") && !archivo.ipLocal.startsWith("169.254.")) {
      return Response.json({ ipLocal: archivo.ipLocal }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch { /* Se informa la solución sin exponer rutas ni errores técnicos. */ }
  return Response.json({ mensaje: "Actualizá la IP del equipo con npm run qr:actualizar-ip y volvé a intentarlo." }, { status: 503 });
}
