import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import DetalleMovimiento from "./[id]/page";
import { BarraFiltrosMovimientos } from "./barra-filtros-movimientos";
import { construirUrlMovimientos, leerFiltrosMovimientos } from "./filtros";
import { ListadoMovimientos } from "./listado-movimientos";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  listarMovimientosStockServidor: vi.fn(),
  obtenerMovimientoStockServidor: vi.fn(),
  listarRepuestosServidor: vi.fn(),
  obtenerRepuestoServidor: vi.fn(),
  listarUsuariosServidor: vi.fn(),
  obtenerUsuarioServidor: vi.fn(),
}));
const listadoSimulado = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/servicios/servidor/movimientos-stock", () => ({
  listarMovimientosStockServidor: s.listarMovimientosStockServidor,
  obtenerMovimientoStockServidor: s.obtenerMovimientoStockServidor,
}));
vi.mock("@/servicios/servidor/repuestos", () => ({
  listarRepuestosServidor: s.listarRepuestosServidor,
  obtenerRepuestoServidor: s.obtenerRepuestoServidor,
}));
vi.mock("@/servicios/servidor/usuarios", () => ({
  listarUsuariosServidor: s.listarUsuariosServidor,
  obtenerUsuarioServidor: s.obtenerUsuarioServidor,
}));

const movimiento = (id: number, extra: object = {}) => ({
  id, repuestoId: 5, codigoRepuesto: "R-5", nombreRepuesto: "Filtro", tipo: "egreso", cantidad: 2, fecha: "2026-10-01T12:00:00Z",
  ubicacion: "A1", usuarioId: null, nombreUsuario: null, motivo: "Entrega", observaciones: "", stockAnterior: 10, stockPosterior: 8, ...extra,
});
const pagina = (elementos: unknown[], totalPaginas = 1) => ({
  elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas,
});
const vacios = { buscar: "", repuestoId: "", tipo: "", fechaDesde: "", fechaHasta: "", ubicacion: "", usuarioId: "", pagina: 1 };
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando…">{ui}</ProveedorNavegacionListado>;
const repuesto = { id: 5, codigo: "R-5", nombre: "Filtro" };
const usuario = { id: 3, nombre: "Ana", apellido: "Pérez" };

beforeEach(() => {
  [...Object.values(s), push, replace, listadoSimulado].forEach((f) => f.mockReset());
  s.listarMovimientosStockServidor.mockResolvedValue(pagina([movimiento(1), movimiento(2, { nombreUsuario: "Ana Pérez", tipo: "ajuste" })]));
  s.listarRepuestosServidor.mockResolvedValue(pagina([repuesto]));
  s.listarUsuariosServidor.mockResolvedValue(pagina([usuario]));
});

describe("filtros de la URL de movimientos", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosMovimientos({})).toEqual(vacios);
    expect(
      leerFiltrosMovimientos({ buscar: "f", repuestoId: "5", tipo: "ingreso", fechaDesde: "2026-10-01", fechaHasta: "2026-10-31", ubicacion: "A", usuarioId: "3", pagina: "2" }),
    ).toEqual({ buscar: "f", repuestoId: "5", tipo: "ingreso", fechaDesde: "2026-10-01", fechaHasta: "2026-10-31", ubicacion: "A", usuarioId: "3", pagina: 2 });
    expect(leerFiltrosMovimientos({ tipo: "otro", fechaDesde: "ayer", repuestoId: "x" })).toEqual(vacios);
    expect(construirUrlMovimientos({ ...vacios, tipo: "egreso", pagina: 2 })).toBe("/repuestos/movimientos?tipo=egreso&pagina=2");
  });
});

describe("listado de movimientos (Server Component)", () => {
  it("muestra filas con el tipo traducido y «Sin registrar» sin usuario", async () => {
    render(conNavegacion(await ListadoMovimientos({ filtros: { ...vacios, tipo: "egreso" } })));
    expect(s.listarMovimientosStockServidor).toHaveBeenCalledWith({ ...vacios, tipo: "egreso" });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Egreso")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Sin registrar")).toBeInTheDocument();
    expect(within(filas[2]).getByText("Ajuste")).toBeInTheDocument();
    expect(within(filas[2]).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/repuestos/movimientos/1");
  });

  it("informa el vacío, muestra el mensaje del error y pagina conservando los filtros", async () => {
    s.listarMovimientosStockServidor.mockResolvedValueOnce(pagina([]));
    const { unmount } = render(await ListadoMovimientos({ filtros: vacios }));
    expect(screen.getByText("No se encontraron movimientos de stock con los filtros aplicados.")).toBeInTheDocument();
    unmount();

    s.listarMovimientosStockServidor.mockRejectedValueOnce(new Error("Rango de fechas inválido."));
    const { unmount: segundo } = render(await ListadoMovimientos({ filtros: vacios }));
    expect(screen.getByRole("alert")).toHaveTextContent("Rango de fechas inválido.");
    segundo();

    s.listarMovimientosStockServidor.mockResolvedValueOnce(pagina([movimiento(1)], 2));
    render(conNavegacion(await ListadoMovimientos({ filtros: { ...vacios, usuarioId: "3", fechaDesde: "2026-10-01" } })));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/repuestos/movimientos?fechaDesde=2026-10-01&usuarioId=3&pagina=2");
  });
});

describe("barra de filtros de movimientos (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("el texto busca una sola vez tras el retardo y no hay botón «Aplicar filtros»", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosMovimientos filtros={{ ...vacios, pagina: 3 }} repuestos={[]} usuarios={[]} />));
    expect(screen.queryByRole("button", { name: "Aplicar filtros" })).not.toBeInTheDocument();
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "f" } });
    fireEvent.change(buscar, { target: { value: "filtro" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/repuestos/movimientos?buscar=filtro");
  });

  it("combina todos los filtros en la URL y los limpia", async () => {
    vi.setSystemTime(new Date(2026, 9, 10, 12));
    render(conNavegacion(<BarraFiltrosMovimientos filtros={vacios} repuestos={[repuesto as never]} usuarios={[usuario as never]} />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "filtro" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtros avanzados" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Repuesto" }));
    fireEvent.click(await screen.findByRole("option", { name: "R-5 - Filtro" }));
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "ingreso" } });
    fireEvent.focus(screen.getByRole("combobox", { name: "Usuario responsable" }));
    fireEvent.click(await screen.findByRole("option", { name: "Ana Pérez" }));
    fireEvent.change(screen.getByLabelText("Ubicación o depósito"), { target: { value: "A1" } });
    fireEvent.click(screen.getByRole("button", { name: "Fecha" }));
    fireEvent.click(screen.getByRole("button", { name: "5 de octubre de 2026" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/repuestos/movimientos?buscar=filtro&repuestoId=5&tipo=ingreso&fechaDesde=2026-10-05&fechaHasta=2026-10-05&ubicacion=A1&usuarioId=3",
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/repuestos/movimientos");
  });

  it("no navega con un rango de fechas invertido (por ejemplo desde la URL) y enfoca el selector de fecha", () => {
    render(conNavegacion(<BarraFiltrosMovimientos filtros={{ ...vacios, fechaDesde: "2026-10-10", fechaHasta: "2026-10-01" }} repuestos={[]} usuarios={[]} />));
    fireEvent.change(screen.getByLabelText("Tipo de movimiento"), { target: { value: "ingreso" } });
    expect(replace).not.toHaveBeenCalled();
    expect(document.getElementById("fechaMovimiento")).toHaveFocus();
  });
});

describe("página del listado de movimientos (Server Component)", () => {
  it("lee searchParams y completa el repuesto y el usuario elegidos que no están en la primera página", async () => {
    vi.resetModules();
    s.obtenerRepuestoServidor.mockResolvedValue({ id: 77, codigo: "R-77", nombre: "Lejano" });
    s.obtenerUsuarioServidor.mockResolvedValue({ id: 88, nombre: "Luis", apellido: "Gómez" });
    vi.doMock("./listado-movimientos", () => ({ ListadoMovimientos: (props: unknown) => { listadoSimulado(props); return <p>Listado simulado</p>; } }));
    const { default: Pagina } = await import("./page");
    render(await Pagina({ searchParams: Promise.resolve({ repuestoId: "77", usuarioId: "88", tipo: "ajuste" }) }));
    expect(s.obtenerRepuestoServidor).toHaveBeenCalledWith(77);
    expect(s.obtenerUsuarioServidor).toHaveBeenCalledWith(88);
    expect(screen.getByRole("combobox", { name: "Repuesto" })).toHaveValue("R-77 - Lejano");
    expect(screen.getByRole("combobox", { name: "Usuario responsable" })).toHaveValue("Luis Gómez");
    expect(screen.getByLabelText("Tipo de movimiento")).toHaveValue("ajuste");
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
  });
});

describe("detalle de movimiento (Server Component)", () => {
  const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

  it("muestra la variación del stock, el repuesto enlazado y valores por defecto", async () => {
    s.obtenerMovimientoStockServidor.mockResolvedValue(movimiento(7));
    render(await DetalleMovimiento(parametros("7")));
    expect(screen.getByRole("heading", { level: 1, name: "Movimiento N° 7" })).toBeInTheDocument();
    expect(screen.getByText("De 10 a 8 unidades")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "R-5 - Filtro" })).toHaveAttribute("href", "/repuestos/5");
    expect(screen.getByText("Sin registrar (todavía no hay login)")).toBeInTheDocument();
    expect(screen.getByText("Sin observaciones")).toBeInTheDocument();
  });

  it("muestra «Sin datos» sin stock previo, el error de carga y rechaza ids inválidos", async () => {
    s.obtenerMovimientoStockServidor.mockResolvedValue(movimiento(7, { stockAnterior: null, stockPosterior: null }));
    const { unmount } = render(await DetalleMovimiento(parametros("7")));
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
    unmount();

    s.obtenerMovimientoStockServidor.mockRejectedValue(new Error("x"));
    const { unmount: segundo } = render(await DetalleMovimiento(parametros("7")));
    expect(screen.getByText("No se pudo obtener la información del movimiento solicitado.")).toBeInTheDocument();
    segundo();

    s.obtenerMovimientoStockServidor.mockClear();
    render(await DetalleMovimiento(parametros("abc")));
    expect(s.obtenerMovimientoStockServidor).not.toHaveBeenCalled();
  });
});
