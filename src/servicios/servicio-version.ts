import { apiObtenerVersion } from "@/servicios/api/api-version";

export async function obtenerVersionSistema() {
  const respuesta = await apiObtenerVersion();
  return respuesta.version;
}
