import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AlertasMaquinaria, Indicadores } from "@/tipos/reporte";
import { estadosDePrueba } from "@/pruebas/estados-orden";
import { armarAccesos } from "./accesos";
import PaginaInicio from "./page";

const servidor = vi.hoisted(() => ({
  obtenerIndicadoresServidor: vi.fn(),
  obtenerAlertasMaquinariaServidor: vi.fn(),
}));
vi.mock("@/servicios/servidor/reportes", () => servidor);
vi.mock("@/servicios/servidor/ordenes-trabajo", async () => {
  const { estadosDePrueba: estados } = await import("@/pruebas/estados-orden");
  return { listarEstadosOrdenTrabajoOVacio: async () => estados };
});

const indicadores: Indicadores = {
  totalOrdenes: 20,
  ordenesPorEstado: [
    { nombre: "pendiente", cantidad: 5 },
    { nombre: "en_progreso", cantidad: 4 },
    { nombre: "pausado", cantidad: 1 },
    { nombre: "en_revision", cantidad: 5 },
    { nombre: "cerrado", cantidad: 5 },
  ],
  ordenesPorPrioridad: [],
  ordenesPorTipo: [],
  ordenesPorTecnico: [],
  activosConMasIntervenciones: [],
  repuestosBajoStock: [{ id: 1, codigo: "R-1", nombre: "Filtro", cantidad: 0, cantidadMinima: 5, estadoStock: "sin_stock", estado: "activo" }],
  promedioHorasHastaInicio: null,
  promedioHorasHastaCierre: null,
  ordenesAltaPrioridadPendientes: 2,
  ordenesPendientesDeValidacion: 5,
  ordenesSinAsignar: 3,
  ordenesRecientes: [],
} as unknown as Indicadores;

const alertas: AlertasMaquinaria = { total: 4, criticas: 1, alertas: [] };

describe("accesos del inicio", () => {
  it("cuenta por fase del catálogo: abiertas son las pendientes y en curso", () => {
    const accesos = armarAccesos(indicadores, alertas, estadosDePrueba);

    expect(accesos).toHaveLength(8);
    expect(accesos.find((a) => a.etiqueta === "Órdenes abiertas")?.valor).toBe(10);
    expect(accesos.find((a) => a.etiqueta === "Pendientes")?.valor).toBe(5);
    expect(accesos.find((a) => a.etiqueta === "En curso")?.valor).toBe(5);
  });

  it("sin catálogo no cuenta órdenes por fase en vez de adivinar por el nombre del estado", () => {
    expect(armarAccesos(indicadores, alertas, []).find((a) => a.etiqueta === "Órdenes abiertas")?.valor).toBe(0);
  });

  it("enlaza cada acceso con su listado filtrado", () => {
    const enlaces = Object.fromEntries(armarAccesos(indicadores, alertas, estadosDePrueba).map((a) => [a.etiqueta, a.href]));

    expect(enlaces["Prioridad alta pendientes"]).toBe("/ordenes-trabajo?prioridad=alta");
    expect(enlaces["Pendientes"]).toBe("/ordenes-trabajo?fase=pendiente");
    expect(enlaces["En curso"]).toBe("/ordenes-trabajo?fase=en_curso");
    expect(enlaces["Por validar"]).toBe("/ordenes-trabajo?fase=por_validar");
    expect(enlaces["Sin asignar"]).toBe("/ordenes-trabajo?sinAsignar=true");
    expect(enlaces["Repuestos con bajo stock"]).toBe("/repuestos?stock=alerta");
  });

  it("si las alertas no se pueden leer, lo indica sin romper el resto", () => {
    const acceso = armarAccesos(indicadores, null, estadosDePrueba).find((a) => a.etiqueta === "Alertas de maquinaria");

    expect(acceso?.valor).toBe("—");
    expect(acceso?.detalle).toBe("No disponible por ahora");
  });
});

describe("pantalla de inicio", () => {
  beforeEach(() => {
    servidor.obtenerIndicadoresServidor.mockReset().mockResolvedValue(indicadores);
    servidor.obtenerAlertasMaquinariaServidor.mockReset().mockResolvedValue(alertas);
  });

  it("muestra los accesos directos y la acción de crear una orden", async () => {
    render(await PaginaInicio());

    const accesos = screen.getByRole("region", { name: "Accesos directos" });
    expect(within(accesos).getByRole("link", { name: /Órdenes abiertas/ })).toHaveAttribute("href", "/ordenes-trabajo");
    expect(within(accesos).getByRole("link", { name: /Sin asignar/ })).toHaveTextContent("3");
    expect(within(accesos).getByRole("link", { name: /Alertas de maquinaria/ })).toHaveTextContent("1 críticas");
    expect(screen.getByRole("link", { name: "Nueva orden de trabajo" })).toHaveAttribute("href", "/ordenes-trabajo/nuevo");
  });

  it("si fallan los indicadores muestra el error en línea", async () => {
    servidor.obtenerIndicadoresServidor.mockRejectedValue(new Error("No se pudieron obtener los indicadores."));

    render(await PaginaInicio());

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron obtener los indicadores.");
  });

  it("si fallan las alertas igual muestra el resto del inicio", async () => {
    servidor.obtenerAlertasMaquinariaServidor.mockRejectedValue(new Error("falla"));

    render(await PaginaInicio());

    expect(screen.getByRole("link", { name: /Alertas de maquinaria/ })).toHaveTextContent("No disponible por ahora");
  });
});
