import type { CantidadPorGrupo } from "@/tipos/reporte";
import type { FaseEstadoOrden, OpcionEstadoOrden } from "@/tipos/orden-trabajo";

/** Suma las órdenes de todos los estados que el catálogo ubica en alguna de las fases dadas. */
export function contarPorFase(grupos: CantidadPorGrupo[], estados: readonly OpcionEstadoOrden[], ...fases: FaseEstadoOrden[]) {
  const estadosDeLasFases = new Set(estados.filter((estado) => fases.includes(estado.fase)).map((estado) => estado.valor));
  return grupos.filter((grupo) => estadosDeLasFases.has(grupo.nombre)).reduce((total, grupo) => total + grupo.cantidad, 0);
}
