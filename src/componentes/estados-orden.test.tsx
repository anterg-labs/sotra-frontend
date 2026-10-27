import { render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { estadosDePrueba } from "@/pruebas/estados-orden";
import { etiquetaLegible, EtiquetaEstadoOrden, ProveedorEstadosOrden, useEstadosOrden, useEtiquetaEstadoOrden, useFaseEstadoOrden } from "./estados-orden";

const conCatalogo = ({ children }: { children: ReactNode }) => (
  <ProveedorEstadosOrden estados={estadosDePrueba}>{children}</ProveedorEstadosOrden>
);

describe("catálogo de estados de las órdenes", () => {
  it("entrega los estados tal como llegan de la API, en su orden", () => {
    const { result } = renderHook(() => useEstadosOrden(), { wrapper: conCatalogo });
    expect(result.current.map((estado) => estado.valor)).toEqual([
      "pendiente", "en_progreso", "en_revision", "cerrado", "pausado", "eliminado",
    ]);
  });

  it("traduce un estado a su etiqueta y, si no está en el catálogo, arma una legible", () => {
    const { result } = renderHook(() => useEtiquetaEstadoOrden(), { wrapper: conCatalogo });
    expect(result.current("en_progreso")).toBe("En progreso");
    expect(result.current("en_pruebas")).toBe("En pruebas");
  });

  it("sin proveedor, el catálogo está vacío y los estados se muestran legibles, sin guion bajo", () => {
    const { result } = renderHook(() => ({ estados: useEstadosOrden(), etiqueta: useEtiquetaEstadoOrden() }));
    expect(result.current.estados).toEqual([]);
    expect(result.current.etiqueta("pausado")).toBe("Pausado");
    expect(result.current.etiqueta("en_progreso")).toBe("En progreso");
  });

  it("etiquetaLegible cambia guiones bajos por espacios y pone la primera letra en mayúscula", () => {
    expect(etiquetaLegible("en_progreso")).toBe("En progreso");
    expect(etiquetaLegible("cerrado")).toBe("Cerrado");
    expect(etiquetaLegible("")).toBe("");
  });

  it("la fase de un estado sale del catálogo y es nula si no lo conoce", () => {
    const { result } = renderHook(() => useFaseEstadoOrden(), { wrapper: conCatalogo });
    expect(result.current("pausado")).toBe("en_curso");
    expect(result.current("en_revision")).toBe("por_validar");
    expect(result.current("inventado")).toBeNull();
  });

  it("la etiqueta de color usa el tono del catálogo y, sin catálogo, el neutro", () => {
    const { unmount } = render(<EtiquetaEstadoOrden estado="pausado" />, { wrapper: conCatalogo });
    expect(screen.getByText("Pausado")).toHaveClass("status", "status-tono-alerta");
    unmount();

    render(<EtiquetaEstadoOrden estado="pausado" />);
    expect(screen.getByText("Pausado")).toHaveClass("status-tono-neutro");
  });
});
