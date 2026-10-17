import type { FiltrosOrdenesTrabajo } from "@/tipos/orden-trabajo";

/** Parámetros de `GET /ordenes-trabajo`: omite los filtros vacíos. Lo comparten el navegador y el servidor. */
export function construirConsultaOrdenes(filtros: FiltrosOrdenesTrabajo) {
  const parametros = new URLSearchParams();
  const campos = ["clienteId", "activoId", "tecnicoId", "estado", "prioridad", "tipo", "fechaDesde", "fechaHasta"] as const;
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  for (const campo of campos) {
    if (filtros[campo] !== "") parametros.append(campo, filtros[campo]);
  }
  if (filtros.conSugerencias) parametros.append("conSugerencias", "true");
  parametros.append("pagina", String(filtros.pagina));
  return parametros.toString();
}
