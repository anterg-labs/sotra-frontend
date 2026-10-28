import type { VisibilidadReporte } from "@/tipos/visibilidad-reportes";
import { crearOpcionesJson, leerDatosApi } from "./solicitudes-http";

export function validarVisibilidadReportes(valor: unknown): VisibilidadReporte[] {
  if (Array.isArray(valor) && valor.every(item => typeof item === "object" && item !== null &&
    typeof item.codigo === "string" && /^[a-z][a-z0-9_]{1,99}$/.test(item.codigo) && typeof item.visible === "boolean") &&
    new Set(valor.map(item => item.codigo)).size === valor.length) return valor;
  throw new Error("La respuesta de visibilidad de reportes no tiene el formato esperado.");
}

export async function apiObtenerVisibilidadReportes() {
  return validarVisibilidadReportes(await leerDatosApi("/api/v1/reportes/visibilidad", { cache: "no-store" },
    "No se pudo obtener la configuración de Reportes."));
}

export async function apiActualizarVisibilidadReporte(codigo: string, visible: boolean) {
  return leerDatosApi("/api/v1/reportes/visibilidad/" + encodeURIComponent(codigo),
    crearOpcionesJson("PUT", { visible }), "No se pudo guardar la configuración de Reportes.");
}
