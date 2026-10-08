import { apiListarRecomendaciones, apiValidarRecomendacion } from "@/servicios/api/api-recomendaciones";

const etiquetasEstadoValidacion: Record<string, string> = {
  pendiente: "Pendiente de validación",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  observada: "Observada",
};

export function obtenerEtiquetaEstadoValidacion(estado: string) {
  return etiquetasEstadoValidacion[estado];
}

export async function listarRecomendaciones(ordenTrabajoId: number) {
  return apiListarRecomendaciones(ordenTrabajoId);
}

export async function validarRecomendacion(
  ordenTrabajoId: number,
  recomendacionId: number,
  resultado: string,
  observacion: string,
) {
  if (resultado === "rechazada" && observacion.trim() === "") {
    throw new Error("Indicá el motivo del rechazo.");
  }

  if (resultado === "observada" && observacion.trim() === "") {
    throw new Error("Escribí la observación sobre la recomendación.");
  }

  return apiValidarRecomendacion(ordenTrabajoId, recomendacionId, resultado, observacion.trim());
}
