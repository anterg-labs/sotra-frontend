import type { Repuesto } from "@/tipos/repuesto";

const textos = {
  normal: { clase: "insignia-stock-normal", simbolo: "✓", texto: "Stock normal" },
  bajo: { clase: "insignia-stock-bajo", simbolo: "!", texto: "Stock bajo" },
  sin_stock: { clase: "insignia-stock-sin-stock", simbolo: "✕", texto: "Sin stock" },
} as const;

type PropiedadesInsigniaStock = {
  estadoStock: Repuesto["estadoStock"];
};

/** Insignia del estado de stock: ícono y texto además del color, para no depender solo de él. */
export function InsigniaStock({ estadoStock }: PropiedadesInsigniaStock) {
  const { clase, simbolo, texto } = textos[estadoStock];
  return (
    <span className={"insignia-stock " + clase}>
      <span aria-hidden="true">{simbolo}</span>
      {texto}
    </span>
  );
}

type PropiedadesBarraNivelStock = {
  cantidad: number;
  cantidadMinima: number;
  estadoStock: Repuesto["estadoStock"];
};

/** Barra fina que compara la cantidad con el mínimo; llena cuando la cantidad duplica el mínimo. */
export function BarraNivelStock({ cantidad, cantidadMinima, estadoStock }: PropiedadesBarraNivelStock) {
  const referencia = Math.max(cantidadMinima * 2, 1);
  const porcentaje = Math.min(100, Math.round((cantidad / referencia) * 100));
  return (
    <div
      aria-label={"Nivel de stock: " + cantidad + " de un mínimo de " + cantidadMinima}
      aria-valuemax={referencia}
      aria-valuemin={0}
      aria-valuenow={Math.min(cantidad, referencia)}
      className={"barra-nivel-stock barra-nivel-" + estadoStock}
      role="meter"
    >
      <span style={{ width: porcentaje + "%" }} />
    </div>
  );
}
