import { useSyncExternalStore } from "react";

/** Ids de los últimos registros creados: el alta (modal) y la tabla viven en islas distintas y comparten solo este dato. */
const ultimos = new Map<string, number>();
const oyentes = new Set<() => void>();

export function marcarCreado(modulo: string, id: number) {
  ultimos.set(modulo, id);
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

export function useUltimoCreado(modulo: string) {
  return useSyncExternalStore(suscribir, () => ultimos.get(modulo) ?? null, () => null);
}
