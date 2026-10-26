import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { estadosDePrueba } from "@/pruebas/estados-orden";
import { etiquetaLegible, ProveedorEstadosOrden, useEstadosOrden, useEtiquetaEstadoOrden } from "./estados-orden";

const conCatalogo = ({ children }: { children: ReactNode }) => (
  <ProveedorEstadosOrden estados={estadosDePrueba}>{children}</ProveedorEstadosOrden>
);

describe("catálogo de estados de las órdenes", () => {
  it("entrega los estados tal como llegan de la API, en su orden", () => {
    const { result } = renderHook(() => useEstadosOrden(), { wrapper: conCatalogo });
    expect(result.current.map((estado) => estado.valor)).toEqual([
      "creada", "asignada", "en_ejecucion", "pausada", "finalizada", "cerrada", "cancelada",
    ]);
  });

  it("traduce un estado a su etiqueta y, si no está en el catálogo, arma una legible", () => {
    const { result } = renderHook(() => useEtiquetaEstadoOrden(), { wrapper: conCatalogo });
    expect(result.current("en_ejecucion")).toBe("En ejecución");
    expect(result.current("en_revision")).toBe("En revision");
  });

  it("sin proveedor, el catálogo está vacío y los estados se muestran legibles, sin guion bajo", () => {
    const { result } = renderHook(() => ({ estados: useEstadosOrden(), etiqueta: useEtiquetaEstadoOrden() }));
    expect(result.current.estados).toEqual([]);
    expect(result.current.etiqueta("pausada")).toBe("Pausada");
    expect(result.current.etiqueta("en_ejecucion")).toBe("En ejecucion");
  });

  it("etiquetaLegible cambia guiones bajos por espacios y pone la primera letra en mayúscula", () => {
    expect(etiquetaLegible("en_ejecucion")).toBe("En ejecucion");
    expect(etiquetaLegible("cerrada")).toBe("Cerrada");
    expect(etiquetaLegible("")).toBe("");
  });
});
