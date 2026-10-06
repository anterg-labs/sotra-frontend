import { leerDatosApi } from "@/servicios/api/solicitudes-http";
import type { Indicadores } from "@/tipos/reporte";

export async function apiObtenerIndicadores() {
  const indicadores = await leerDatosApi("/api/v1/reportes/indicadores", { cache: "no-store" }, "No se pudieron obtener los indicadores.");
  return indicadores as Indicadores;
}
