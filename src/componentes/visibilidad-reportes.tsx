"use client";

import { createContext, useContext, type ReactNode } from "react";

const ContextoVisibilidad = createContext<ReadonlySet<string>>(new Set());

export function ProveedorVisibilidadReportes({ desactivados, children }: { desactivados: string[]; children: ReactNode }) {
  return <ContextoVisibilidad.Provider value={new Set(desactivados)}>{children}</ContextoVisibilidad.Provider>;
}

export function useReporteVisible(codigo: string) {
  return !useContext(ContextoVisibilidad).has(codigo);
}

export function ElementoReporte({ codigo, children }: { codigo: string; children: ReactNode }) {
  return useReporteVisible(codigo) ? <>{children}</> : null;
}
