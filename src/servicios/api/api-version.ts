import { leerDatosApi } from "@/servicios/api/solicitudes-http";
import type { VersionSistema } from "@/tipos/version";

export async function apiObtenerVersion() {
  const version = await leerDatosApi("/api/v1/version", { cache: "no-store" }, "No se pudo obtener la versión.");
  return version as VersionSistema;
}
