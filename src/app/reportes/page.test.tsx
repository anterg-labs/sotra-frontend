import { fireEvent, render as renderBase, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { conEstadosOrden, estadosDePrueba } from "@/pruebas/estados-orden";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import { construirUrlReportes, leerFiltrosReportes } from "./filtros";
import PaginaReportes from "./page";
import { ResumenIndicadores } from "./resumen-indicadores";
import { TableroReportes } from "./tablero-reportes";

function render(ui: ReactElement) {
  return renderBase(conEstadosOrden(ui));
}

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  obtenerIndicadoresServidor: vi.fn(),
  listarTecnicosServidor: vi.fn(),
  listarEstadosOrdenTrabajoOVacio: vi.fn(),
  listarClientesServidor: vi.fn(),
  obtenerClienteServidor: vi.fn(),
  listarActivosServidor: vi.fn(),
  obtenerActivoServidor: vi.fn(),
  obtenerUsuarioServidor: vi.fn(),
  listarTecnicosPaginados: vi.fn(),
  listarClientesPaginados: vi.fn(),
  listarActivosPaginados: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/servicios/servidor/reportes", () => ({ obtenerIndicadoresServidor: s.obtenerIndicadoresServidor }));
vi.mock("@/servicios/servidor/ordenes-trabajo", () => ({
  listarTecnicosServidor: s.listarTecnicosServidor,
  listarEstadosOrdenTrabajoOVacio: s.listarEstadosOrdenTrabajoOVacio,
}));
vi.mock("@/servicios/servidor/clientes", () => ({ listarClientesServidor: s.listarClientesServidor, obtenerClienteServidor: s.obtenerClienteServidor }));
vi.mock("@/servicios/servidor/activos", () => ({ listarActivosServidor: s.listarActivosServidor, obtenerActivoServidor: s.obtenerActivoServidor }));
vi.mock("@/servicios/servidor/usuarios", () => ({ obtenerUsuarioServidor: s.obtenerUsuarioServidor }));
vi.mock("@/servicios/servicio-reportes", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/servicios/servicio-reportes")>()),
  obtenerUrlReportePdf: (tipo: string, f: Record<string, string>, prioridad: string) =>
    `pdf:${tipo}:${f.estado}:${f.clienteId}:${prioridad}`,
  obtenerUrlReporteCsv: (tipo: string, f: Record<string, string>, prioridad: string) =>
    `csv:${tipo}:${f.estado}:${f.clienteId}:${prioridad}`,
}));
vi.mock("@/servicios/servicio-ordenes-trabajo", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/servicios/servicio-ordenes-trabajo")>()),
  listarTecnicosPaginados: s.listarTecnicosPaginados,
}));
vi.mock("@/servicios/servicio-clientes", () => ({ listarClientesPaginados: s.listarClientesPaginados }));
vi.mock("@/servicios/servicio-activos", () => ({ listarActivosPaginados: s.listarActivosPaginados }));
vi.mock("@/componentes/panel-analitica", () => ({
  PanelAnalitica: ({ filtros }: { filtros: unknown }) => <div data-testid="panel-analitica">{JSON.stringify(filtros)}</div>,
}));

const indicadores = {
  totalOrdenes: 14,
  ordenesPorEstado: [{ nombre: "Pendiente", cantidad: 3 }],
  ordenesPorPrioridad: [],
  ordenesPorTipo: [{ nombre: "Correctivo", cantidad: 9 }],
  ordenesPorTecnico: [],
  activosConMasIntervenciones: [{ nombre: "Retro 1", cantidad: 4 }],
  repuestosBajoStock: [
    { id: 3, codigo: "REP-3", nombre: "Filtro", cantidad: 1, cantidadMinima: 5, estadoStock: "bajo", estado: "activo" },
  ],
  promedioHorasHastaInicio: 2.5,
  promedioHorasHastaCierre: null,
  ordenesAltaPrioridadPendientes: 2,
  ordenesPendientesDeValidacion: 1,
  ordenesRecientes: [
    { id: 11, nombreCliente: "ACME", nombreActivo: "Retro 1", nombreTecnico: null, prioridad: "alta", estado: "en_progreso" },
  ],
};
const pagina = (elementos: unknown[]) => ({ elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 });
const filtrosVacios = { fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "" };
const tecnicos = [{ id: 7, nombre: "Tomás", apellido: "Ruiz" }];
const clientes = [{ id: 1, razonSocial: "ACME" }, { id: 2, razonSocial: "Otro" }];
const activos = [{ id: 5, clienteId: 1, nombre: "Retro 1", numSerie: "S1" }, { id: 6, clienteId: 2, nombre: null, numSerie: "S2" }];

function tablero(filtros = filtrosVacios) {
  return (
    <ProveedorNavegacionListado etiquetaCarga="Cargando indicadores…">
      <TableroReportes activos={activos as never} clientes={clientes as never} filtros={filtros} tecnicos={tecnicos as never}>
        <p>Resumen simulado</p>
      </TableroReportes>
    </ProveedorNavegacionListado>
  );
}

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  s.listarEstadosOrdenTrabajoOVacio.mockResolvedValue(estadosDePrueba);
  push.mockReset();
  replace.mockReset();
  s.obtenerIndicadoresServidor.mockResolvedValue(indicadores);
  s.listarTecnicosServidor.mockResolvedValue(tecnicos);
  s.listarClientesServidor.mockResolvedValue(pagina(clientes));
  s.listarActivosServidor.mockResolvedValue(pagina(activos));
});

describe("filtros de la URL de reportes", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosReportes({}, estadosDePrueba)).toEqual(filtrosVacios);
    expect(
      leerFiltrosReportes({ fechaDesde: "2026-05-01", fechaHasta: "2026-05-31", tecnicoId: "7", clienteId: "1", activoId: "5", estado: "cerrado", tipo: "preventivo" }, estadosDePrueba),
    ).toEqual({ fechaDesde: "2026-05-01", fechaHasta: "2026-05-31", tecnicoId: "7", clienteId: "1", activoId: "5", estado: "cerrado", tipo: "preventivo" });
    expect(leerFiltrosReportes({ fechaDesde: "ayer", tecnicoId: "x", estado: "otro", tipo: "raro" }, estadosDePrueba)).toEqual(filtrosVacios);
    expect(construirUrlReportes({ ...filtrosVacios, estado: "cerrado" })).toBe("/reportes?estado=cerrado");
  });
});

describe("página de reportes (Server Component)", () => {
  it("lee searchParams, carga las opciones en el servidor y arma el tablero", async () => {
    vi.resetModules();
    vi.doMock("./resumen-indicadores", () => ({ ResumenIndicadores: () => <p>Resumen simulado</p> }));
    const { default: Pagina } = await import("./page");
    // Tras `resetModules` el contexto es otro: el proveedor tiene que salir del mismo módulo que la página.
    const { conEstadosOrden: conEstadosDeEstaCarga } = await import("@/pruebas/estados-orden");
    renderBase(conEstadosDeEstaCarga(await Pagina({ searchParams: Promise.resolve({ estado: "cerrado", clienteId: "1" }) })));
    expect(screen.getByRole("heading", { level: 1, name: "Reportes e indicadores" })).toBeInTheDocument();
    expect(screen.getByLabelText("Estado")).toHaveValue("cerrado");
    expect(screen.getByRole("combobox", { name: "Cliente" })).toHaveValue("ACME");
    expect(await screen.findByText("Resumen simulado")).toBeInTheDocument();
  });

  it("si fallan las opciones de los filtros la pantalla sigue funcionando", async () => {
    s.listarTecnicosServidor.mockRejectedValue(new Error("x"));
    s.listarClientesServidor.mockRejectedValue(new Error("x"));
    render(await PaginaReportes({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { level: 1, name: "Reportes e indicadores" })).toBeInTheDocument();
  });
});

describe("resumen de indicadores (Server Component)", () => {
  it("lleva cada punto de «Atención necesaria» a su listado", async () => {
    render(await ResumenIndicadores({ filtros: filtrosVacios }));
    expect(screen.getByRole("link", { name: /órdenes de prioridad alta pendientes/ })).toHaveAttribute("href", "/ordenes-trabajo?prioridad=alta");
    expect(screen.getByRole("link", { name: /pendientes de validación/ })).toHaveAttribute("href", "/ordenes-trabajo?fase=por_validar");
    expect(screen.getByRole("link", { name: /repuestos con bajo stock/ })).toHaveAttribute("href", "/repuestos?stock=alerta");
  });

  it("muestra los indicadores, tablas y alertas", async () => {
    render(await ResumenIndicadores({ filtros: { ...filtrosVacios, estado: "cerrado" } }));
    expect(s.obtenerIndicadoresServidor).toHaveBeenCalledWith({ ...filtrosVacios, estado: "cerrado" });
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("2.5 h")).toBeInTheDocument();
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
    expect(screen.getByText(/órdenes de prioridad alta pendientes/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todas" })).toHaveAttribute("href", "/ordenes-trabajo");
    const recientes = screen.getByRole("heading", { name: "Órdenes recientes" }).closest("section") as HTMLElement;
    expect(within(recientes).getByText("En progreso")).toBeInTheDocument();
    expect(within(recientes).getByText("Sin asignar")).toBeInTheDocument();
    const grupo = screen.getByRole("heading", { name: "Órdenes por prioridad" }).closest("section") as HTMLElement;
    expect(within(grupo).getByText("No hay datos registrados.")).toBeInTheDocument();
    const bajoStock = screen.getByRole("heading", { name: "Repuestos con bajo stock" }).closest("section") as HTMLElement;
    expect(within(bajoStock).getByText("REP-3")).toBeInTheDocument();
    expect(within(bajoStock).getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/repuestos/3");
    expect(within(bajoStock).getByRole("link", { name: "Ver en Repuestos" })).toHaveAttribute("href", "/repuestos?stock=alerta");
  });

  it("muestra los estados vacíos de órdenes recientes y repuestos, y el error", async () => {
    s.obtenerIndicadoresServidor.mockResolvedValueOnce({ ...indicadores, ordenesRecientes: [], repuestosBajoStock: [] });
    const { unmount } = render(await ResumenIndicadores({ filtros: filtrosVacios }));
    expect(screen.getByText("No hay órdenes de trabajo registradas.")).toBeInTheDocument();
    expect(screen.getByText("No hay repuestos con bajo stock.")).toBeInTheDocument();
    unmount();

    s.obtenerIndicadoresServidor.mockRejectedValueOnce(new Error("No se pudieron obtener los indicadores."));
    render(await ResumenIndicadores({ filtros: filtrosVacios }));
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron obtener los indicadores.");
  });
});

describe("tablero de reportes (isla)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("aplica los filtros en la URL y los limpia", () => {
    render(tablero());
    fireEvent.focus(screen.getByRole("combobox", { name: "Técnico" }));
    fireEvent.click(screen.getByRole("option", { name: "Tomás Ruiz" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Cliente" }));
    fireEvent.click(screen.getByRole("option", { name: "ACME" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "cerrado" } });
    fireEvent.change(screen.getByLabelText("Tipo de mantenimiento"), { target: { value: "preventivo" } });
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-05-01" } });
    expect(screen.queryByRole("button", { name: "Aplicar filtros" })).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith(
      "/reportes?fechaDesde=2026-05-01&fechaHasta=2026-05-01&tecnicoId=7&clienteId=1&estado=cerrado&tipo=preventivo",
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/reportes");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Estado")).toHaveValue("");
  });

  it("al elegir un cliente solo ofrece sus activos y descarta el activo previo", () => {
    render(tablero());
    fireEvent.focus(screen.getByRole("combobox", { name: "Activo" }));
    expect(within(screen.getByRole("listbox")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Retro 1", "S2"]);
    fireEvent.click(screen.getByRole("option", { name: "S2" }));

    fireEvent.focus(screen.getByRole("combobox", { name: "Cliente" }));
    fireEvent.click(screen.getByRole("option", { name: "ACME" }));
    expect(screen.getByRole("combobox", { name: "Activo" })).toHaveValue("");
    fireEvent.focus(screen.getByRole("combobox", { name: "Activo" }));
    expect(within(screen.getByRole("listbox")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Retro 1"]);
  });

  it("no navega con un rango de fechas invertido y enfoca la fecha final", () => {
    render(tablero());
    fireEvent.click(screen.getByRole("switch", { name: "Rango de fechas" }));
    fireEvent.change(screen.getByLabelText("Fecha desde"), { target: { value: "2026-06-10" } });
    fireEvent.change(screen.getByLabelText("Fecha hasta"), { target: { value: "2026-06-01" } });
    const navegacionesValidas = replace.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Fecha hasta"), { target: { value: "2026-06-01" } });
    expect(screen.getByLabelText("Fecha hasta")).toHaveFocus();
    expect(replace).toHaveBeenCalledTimes(navegacionesValidas);
  });

  it("los enlaces de descarga reflejan el tipo de reporte, la prioridad y los filtros", () => {
    render(tablero());
    expect(screen.getByRole("link", { name: "Descargar PDF" })).toHaveAttribute("href", "pdf:ordenes-trabajo:::");
    fireEvent.change(screen.getByLabelText("Tipo de reporte"), { target: { value: "indicadores" } });
    fireEvent.change(screen.getByLabelText("Prioridad"), { target: { value: "alta" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "pausado" } });
    expect(screen.getByRole("link", { name: "Descargar PDF" })).toHaveAttribute("href", "pdf:indicadores:pausado::alta");
    expect(screen.getByRole("link", { name: "Descargar CSV" })).toHaveAttribute("href", "csv:indicadores:pausado::alta");
    expect(screen.getByRole("link", { name: "Descargar PDF" })).toHaveAttribute("rel", "noreferrer");
  });

  it("las pestañas alternan entre resumen y análisis, pasando los filtros aplicados", () => {
    render(tablero({ ...filtrosVacios, estado: "cerrado" }));
    const resumen = screen.getByRole("tab", { name: "Resumen" });
    const analisis = screen.getByRole("tab", { name: "Análisis y alertas" });
    expect(resumen).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("panel-analitica")).not.toBeInTheDocument();

    fireEvent.click(analisis);
    expect(analisis).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-analitica")).toHaveTextContent(JSON.stringify({ ...filtrosVacios, estado: "cerrado" }));
    expect(document.getElementById("panel-resumen")).toHaveAttribute("hidden");

    fireEvent.click(resumen);
    expect(screen.queryByTestId("panel-analitica")).not.toBeInTheDocument();
    expect(screen.getByText("Resumen simulado")).toBeInTheDocument();
  });
});
