import type { MetricaComparada } from "@/tipos/reporte";

/** Verde si el cambio es una mejora, rojo si es un empeoramiento y gris si no hay juicio de valor o no cambió. */
export function tonoDeLaVariacion(metrica: Pick<MetricaComparada, "variacionPorcentual" | "mejorSiSube">) {
  const { variacionPorcentual: variacion, mejorSiSube } = metrica;
  if (variacion === null || variacion === 0 || mejorSiSube === null) return "grafico-tono-neutro";
  return variacion > 0 === mejorSiSube ? "grafico-tono-bueno" : "grafico-tono-malo";
}
