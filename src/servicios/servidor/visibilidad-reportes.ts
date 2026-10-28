import "server-only";
import { leerJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import { validarVisibilidadReportes } from "@/servicios/api/api-visibilidad-reportes";

export async function obtenerVisibilidadReportesServidor() {
  return validarVisibilidadReportes(await leerJsonServidor<unknown>("/api/v1/reportes/visibilidad",
    "No se pudo obtener la configuración de Reportes."));
}
