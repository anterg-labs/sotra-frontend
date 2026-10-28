import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemorasPorEtapa, ResumenDeEtapa } from "./demoras-por-etapa";
import { NOMBRES_ETAPA, type DemorasEtapas, type EstadisticaEtapa } from "@/tipos/demoras-etapas";
import { leerDemorasEtapas, leerUmbralesEtapa } from "@/servicios/api/contrato-demoras-etapas";

const api = vi.hoisted(() => ({ apiObtenerDemorasEtapas: vi.fn() }));
vi.mock("@/servicios/api/api-demoras-etapas", () => api);
const filtros = { fechaDesde: "", fechaHasta: "", clienteId: "", activoId: "", estado: "", tipo: "" };
const etapa: EstadisticaEtapa = { etapa: "pendiente", nombre: "Pendiente", cantidadOrdenes: 3, promedioHoras: 11, medianaHoras: 2, percentil90Horas: 24.4, promedioHistoricoHoras: 11, muestraHistorica: 3, umbralHoras: 10, origenUmbral: "configurado", demoradas: 1 };
const datos: DemorasEtapas = {
  calculadoEn: "2026-10-27T00:00:00Z",
  etapas: [etapa, ...(["en_progreso", "revision", "pausa"] as const).map(codigo => ({ ...etapa, etapa: codigo, nombre: NOMBRES_ETAPA[codigo] }))],
  demoradas: { elementos: [{ ordenId: 12, activoId: 5, nombreActivo: "Retro de prueba", etapa: "pendiente", horas: 30, umbralHoras: 10, excesoHoras: 20, enCurso: true }], pagina: 1, tamanoPagina: 20, totalElementos: 21, totalPaginas: 2 },
};
beforeEach(() => api.apiObtenerDemorasEtapas.mockReset());

describe("demoras por etapa", () => {
  it("muestra media, mediana, línea de referencia y alternativa tabular", () => {
    render(<ResumenDeEtapa datos={etapa} />);
    expect(screen.getByRole("img", { name: "Pendiente: media 11 h, mediana 2 h, referencia 10 h" })).toBeVisible();
    expect(screen.getByText("Configurada por el administrador", { exact: false })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Ver como tabla" }));
    expect(within(screen.getByRole("table")).getByText("Media (promedio)")).toBeVisible();
    expect(within(screen.getByRole("table")).getByText("2 h")).toBeVisible();
    fireEvent.click(screen.getByText("Cómo se calcula"));
    expect(screen.getByText(/la pausa no se suma a progreso/)).toBeVisible();
  });
  it("permite paginar y filtrar la lista y enlaza a la orden", async () => {
    api.apiObtenerDemorasEtapas.mockResolvedValue(datos);
    render(<DemorasPorEtapa filtros={filtros} />);
    expect(await screen.findByRole("link", { name: "Orden 12" })).toHaveAttribute("href", "/ordenes-trabajo/12");
    expect(screen.getByRole("table", { name: "Órdenes demoradas por etapa" })).toHaveTextContent("20 h");
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    await screen.findByRole("link", { name: "Orden 12" });
    expect(api.apiObtenerDemorasEtapas).toHaveBeenLastCalledWith(filtros, 2, "");
    fireEvent.change(screen.getByLabelText("Etapa de las órdenes demoradas"), { target: { value: "pausa" } });
    await screen.findByRole("link", { name: "Orden 12" });
    expect(api.apiObtenerDemorasEtapas).toHaveBeenLastCalledWith(filtros, 1, "pausa");
  });
  it("ofrece reintento tras un fallo y distingue la falta de datos", async () => {
    api.apiObtenerDemorasEtapas.mockRejectedValueOnce(new Error("Sin conexión"));
    api.apiObtenerDemorasEtapas.mockResolvedValue({ ...datos, etapas: [{ ...etapa, cantidadOrdenes: 0, promedioHoras: null, medianaHoras: null, umbralHoras: null, origenUmbral: "sin_datos" }], demoradas: { ...datos.demoradas, elementos: [], totalElementos: 0, totalPaginas: 0 } });
    render(<DemorasPorEtapa filtros={filtros} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("No hay tiempos registrados en esta etapa con los filtros elegidos.")).toBeVisible();
    expect(screen.getByText("Sin referencia disponible", { exact: false })).toBeVisible();
  });
  it("valida el contrato y rechaza etapas desconocidas o números no finitos", () => {
    expect(leerDemorasEtapas(datos)).toEqual(datos);
    expect(() => leerDemorasEtapas({ ...datos, etapas: [etapa] })).toThrow(/formato esperado/);
    expect(() => leerUmbralesEtapa([{ etapa: "pausa", umbralHoras: Infinity }])).toThrow();
    expect(() => leerUmbralesEtapa([{ etapa: "otra", umbralHoras: 1 }])).toThrow();
    expect(leerUmbralesEtapa([{ etapa: "pausa", umbralHoras: 0 }])).toEqual([{ etapa: "pausa", umbralHoras: 0 }]);
  });
});
