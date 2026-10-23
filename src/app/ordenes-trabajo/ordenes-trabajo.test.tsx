import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import { OrdenesAsociadas } from "@/componentes/ordenes-asociadas";
import EditarOrden from "./[id]/editar/page";
import DetalleOrden from "./[id]/page";
import { DetalleOrdenTrabajo } from "./[id]/detalle-orden";
import { BarraFiltrosOrdenes } from "./barra-filtros-ordenes";
import { construirUrlOrdenes, leerFiltrosOrdenes } from "./filtros";
import { ListadoOrdenes } from "./listado-ordenes";
import NuevaOrden from "./nuevo/page";
import PaginaOrdenes from "./page";
import { ProveedorSesion } from "@/componentes/sesion/contexto-sesion";
import { usuarioDePruebas } from "@/pruebas/sesion-de-pruebas";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const listadoSimulado = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  // Navegador (servicios de cliente)
  listarOrdenesTrabajo: vi.fn(),
  asignarTecnicoOrdenTrabajo: vi.fn(),
  cambiarEstadoOrdenTrabajo: vi.fn(),
  actualizarOrdenTrabajo: vi.fn(),
  crearOrdenTrabajo: vi.fn(),
  listarTecnicosPaginados: vi.fn(),
  listarClientesPaginados: vi.fn(),
  listarActivosPaginados: vi.fn(),
  // Servidor
  listarOrdenesTrabajoServidor: vi.fn(),
  obtenerOrdenTrabajoServidor: vi.fn(),
  listarTecnicosServidor: vi.fn(),
  obtenerIndicadoresServidor: vi.fn(),
  listarClientesServidor: vi.fn(),
  obtenerClienteServidor: vi.fn(),
  listarActivosServidor: vi.fn(),
  obtenerActivoServidor: vi.fn(),
  listarRepuestosServidor: vi.fn(),
  obtenerRepuestoServidor: vi.fn(),
  obtenerUsuarioServidor: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/servicios/servicio-ordenes-trabajo", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/servicios/servicio-ordenes-trabajo")>()),
  listarOrdenesTrabajo: s.listarOrdenesTrabajo,
  asignarTecnicoOrdenTrabajo: s.asignarTecnicoOrdenTrabajo,
  cambiarEstadoOrdenTrabajo: s.cambiarEstadoOrdenTrabajo,
  actualizarOrdenTrabajo: s.actualizarOrdenTrabajo,
  crearOrdenTrabajo: s.crearOrdenTrabajo,
  listarTecnicosPaginados: s.listarTecnicosPaginados,
}));
vi.mock("@/servicios/servicio-clientes", () => ({ listarClientesPaginados: s.listarClientesPaginados }));
vi.mock("@/servicios/servicio-activos", () => ({ listarActivosPaginados: s.listarActivosPaginados }));
vi.mock("@/servicios/servidor/ordenes-trabajo", async (importarReal) => ({
  conTecnicoDeLaOrden: (await importarReal<typeof import("@/servicios/servidor/ordenes-trabajo")>()).conTecnicoDeLaOrden,
  listarOrdenesTrabajoServidor: s.listarOrdenesTrabajoServidor,
  obtenerOrdenTrabajoServidor: s.obtenerOrdenTrabajoServidor,
  listarTecnicosServidor: s.listarTecnicosServidor,
}));
vi.mock("@/servicios/servidor/reportes", () => ({ obtenerIndicadoresServidor: s.obtenerIndicadoresServidor }));
vi.mock("@/servicios/servidor/clientes", () => ({
  listarClientesServidor: s.listarClientesServidor,
  obtenerClienteServidor: s.obtenerClienteServidor,
}));
vi.mock("@/servicios/servidor/activos", () => ({
  listarActivosServidor: s.listarActivosServidor,
  obtenerActivoServidor: s.obtenerActivoServidor,
}));
vi.mock("@/servicios/servidor/repuestos", () => ({
  listarRepuestosServidor: s.listarRepuestosServidor,
  obtenerRepuestoServidor: s.obtenerRepuestoServidor,
}));
vi.mock("@/servicios/servidor/usuarios", () => ({ obtenerUsuarioServidor: s.obtenerUsuarioServidor }));
vi.mock("@/componentes/evidencias-orden-trabajo", () => ({
  EvidenciasOrdenTrabajo: (p: { ordenTrabajoId: number; permiteRegistrar: boolean }) => (
    <div data-registrar={String(p.permiteRegistrar)} data-testid="evidencias">{p.ordenTrabajoId}</div>
  ),
}));
vi.mock("@/componentes/formulario-orden-trabajo", () => ({
  FormularioOrdenTrabajo: (p: {
    etiquetaConfirmacion: string;
    ordenInicial?: { id: number };
    clientes: unknown[];
    activos: unknown[];
    tecnicos: unknown[];
    repuestos: unknown[];
    alEnviar: (datos: unknown) => Promise<unknown>;
  }) => (
    <form
      aria-label="Formulario de orden"
      data-activos={p.activos.length}
      data-clientes={p.clientes.length}
      data-orden={p.ordenInicial?.id}
      data-repuestos={p.repuestos.length}
      data-tecnicos={p.tecnicos.length}
      onSubmit={(e) => {
        e.preventDefault();
        void p.alEnviar({ descripcion: "x" });
      }}
    >
      <button type="submit">{p.etiquetaConfirmacion}</button>
    </form>
  ),
}));

const pagina = (elementos: unknown[], totalPaginas = 1) => ({
  elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas,
});
const orden = (id: number, extra: Record<string, unknown> = {}) => ({
  id, clienteId: 1, nombreCliente: "ACME", activoId: 2, nombreActivo: "Retro 1", tecnicoId: null, nombreTecnico: null,
  tipo: "correctivo", prioridad: "alta", descripcion: "Cambiar filtro", observaciones: "", fechaPrevistaEjecucion: "2026-10-20",
  estado: "creada", creadoEn: "2026-10-01T10:00:00Z", fechaInicio: null, fechaCierre: null, sugerencias: [], repuestos: [],
  estadosSiguientes: ["asignada", "pausada"],
  historialEstados: [
    { estado: "creada", fechaHora: "2026-10-01T10:00:00Z", observacion: "Alta" },
    { estado: "asignada", fechaHora: "2026-10-02T10:00:00Z", observacion: "Asignada a Tomás" },
  ],
  version: "v1",
  ...extra,
});
const tecnico = { id: 7, nombre: "Tomás", apellido: "Ruiz" };
const cliente = { id: 1, razonSocial: "ACME", estado: "activo" };
const activo = { id: 2, clienteId: 1, nombre: "Retro 1", numSerie: "S1", estado: "activo" };
const resumen = { totalOrdenes: 30, ordenesPorEstado: [{ nombre: "creada", cantidad: 5 }, { nombre: "cerrada", cantidad: 9 }] };
const filtrosVacios = {
  buscar: "", clienteId: "", activoId: "", tecnicoId: "", estado: "", prioridad: "", tipo: "",
  fechaDesde: "", fechaHasta: "", conSugerencias: false, pagina: 1,
};
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando…">{ui}</ProveedorNavegacionListado>;
const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  [...Object.values(s), push, replace, listadoSimulado].forEach((f) => f.mockReset());
  s.listarOrdenesTrabajoServidor.mockResolvedValue(pagina([orden(1), orden(2, { estado: "cerrada", nombreTecnico: "Tomás Ruiz" })]));
  s.obtenerIndicadoresServidor.mockResolvedValue(resumen);
  s.listarClientesServidor.mockResolvedValue(pagina([cliente]));
  s.listarActivosServidor.mockResolvedValue(pagina([activo]));
  s.listarTecnicosServidor.mockResolvedValue([tecnico]);
  s.listarRepuestosServidor.mockResolvedValue(pagina([{ id: 3, codigo: "R3", nombre: "Filtro" }]));
  s.listarTecnicosPaginados.mockResolvedValue([tecnico]);
});

describe("filtros de la URL de órdenes", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosOrdenes({})).toEqual(filtrosVacios);
    expect(
      leerFiltrosOrdenes({
        buscar: "fuga", clienteId: "1", activoId: "2", tecnicoId: "7", estado: "pausada", prioridad: "alta", tipo: "preventivo",
        fechaDesde: "2026-10-01", fechaHasta: "2026-10-31", conSugerencias: "true", pagina: "2",
      }),
    ).toEqual({
      buscar: "fuga", clienteId: "1", activoId: "2", tecnicoId: "7", estado: "pausada", prioridad: "alta", tipo: "preventivo",
      fechaDesde: "2026-10-01", fechaHasta: "2026-10-31", conSugerencias: true, pagina: 2,
    });
    expect(leerFiltrosOrdenes({ estado: "x", prioridad: "urgente", tipo: "otro", fechaDesde: "ayer", conSugerencias: "si", clienteId: "1;" })).toEqual(filtrosVacios);
    expect(construirUrlOrdenes({ ...filtrosVacios, estado: "pausada", conSugerencias: true, pagina: 2 })).toBe(
      "/ordenes-trabajo?estado=pausada&conSugerencias=true&pagina=2",
    );
  });
});

describe("página del listado de órdenes (Server Component)", () => {
  it("lee searchParams, completa las opciones elegidas y muestra las tarjetas de resumen", async () => {
    vi.resetModules();
    s.obtenerUsuarioServidor.mockResolvedValue({ id: 99, nombre: "Luis", apellido: "Gómez" });
    vi.doMock("./listado-ordenes", () => ({ ListadoOrdenes: (props: unknown) => { listadoSimulado(props); return <p>Listado simulado</p>; } }));
    const { default: Pagina } = await import("./page");
    render(await Pagina({ searchParams: Promise.resolve({ tecnicoId: "99", estado: "pausada", pagina: "2" }) }));
    expect(s.obtenerUsuarioServidor).toHaveBeenCalledWith(99);
    expect(screen.getByRole("heading", { level: 1, name: "Órdenes de trabajo" })).toBeInTheDocument();
    const tarjetas = screen.getByRole("region", { name: "Resumen de órdenes de trabajo" });
    expect(within(tarjetas).getByText("30")).toBeInTheDocument();
    expect(within(tarjetas).getByText("5")).toBeInTheDocument();
    expect(within(tarjetas).getByText("9")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Técnico" })).toHaveValue("Luis Gómez");
    expect(screen.getByLabelText("Estado")).toHaveValue("pausada");
    expect(screen.getByRole("link", { name: "Crear orden" })).toHaveAttribute("href", "/ordenes-trabajo/nuevo");
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
    expect(listadoSimulado).toHaveBeenCalledWith({ consulta: expect.any(Promise), filtros: { ...filtrosVacios, tecnicoId: "99", estado: "pausada", pagina: 2 } });
  });

  it("si falla el resumen o las opciones, la pantalla sigue funcionando", async () => {
    s.obtenerIndicadoresServidor.mockRejectedValue(new Error("x"));
    s.listarClientesServidor.mockRejectedValue(new Error("y"));
    render(await PaginaOrdenes({ searchParams: Promise.resolve({}) }));
    expect(screen.queryByRole("region", { name: "Resumen de órdenes de trabajo" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Órdenes de trabajo" })).toBeInTheDocument();
  });
});

describe("listado de órdenes (Server Component)", () => {
  it("muestra la tabla: sin asignar, estado y fecha prevista traducidos, y modificar solo si no está cerrada", async () => {
    render(conNavegacion(await ListadoOrdenes({ filtros: { ...filtrosVacios, prioridad: "alta" } })));
    expect(s.listarOrdenesTrabajoServidor).toHaveBeenCalledWith({ ...filtrosVacios, prioridad: "alta" });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Sin asignar")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Creada")).toBeInTheDocument();
    expect(within(filas[1]).getByText("20/10/2026")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Modificar orden" })).toHaveAttribute("href", "/ordenes-trabajo/1/editar");
    expect(within(filas[2]).queryByRole("link", { name: "Modificar orden" })).not.toBeInTheDocument();
    expect(within(filas[2]).getByText("Tomás Ruiz")).toBeInTheDocument();
  });

  it("muestra el mensaje del error, el vacío y pagina conservando los filtros", async () => {
    s.listarOrdenesTrabajoServidor.mockRejectedValueOnce(new Error("Rango demasiado amplio."));
    const { unmount } = render(await ListadoOrdenes({ filtros: filtrosVacios }));
    expect(screen.getByRole("alert")).toHaveTextContent("Rango demasiado amplio.");
    unmount();

    s.listarOrdenesTrabajoServidor.mockResolvedValueOnce(pagina([]));
    const { unmount: segundo } = render(await ListadoOrdenes({ filtros: filtrosVacios }));
    expect(screen.getByText("No se encontraron órdenes de trabajo con los filtros aplicados.")).toBeInTheDocument();
    segundo();

    s.listarOrdenesTrabajoServidor.mockResolvedValueOnce(pagina([orden(1)], 3));
    render(conNavegacion(await ListadoOrdenes({ filtros: { ...filtrosVacios, estado: "pausada", conSugerencias: true } })));
    expect(screen.getByText("Página 1 de 3 (1 órdenes)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/ordenes-trabajo?estado=pausada&conSugerencias=true&pagina=2");
  });
});

describe("barra de filtros de órdenes (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("el texto busca una sola vez tras el retardo y no hay botón «Aplicar filtros»", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosOrdenes activos={[]} clientes={[]} filtros={{ ...filtrosVacios, pagina: 4 }} tecnicos={[]} />));
    expect(screen.queryByRole("button", { name: "Aplicar filtros" })).not.toBeInTheDocument();
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "f" } });
    fireEvent.change(buscar, { target: { value: "fuga" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/ordenes-trabajo?buscar=fuga");
  });

  it("combina todos los filtros en la URL y los limpia", async () => {
    render(conNavegacion(<BarraFiltrosOrdenes activos={[activo as never]} clientes={[cliente as never]} filtros={filtrosVacios} tecnicos={[tecnico as never]} />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "fuga" } });
    fireEvent.focus(screen.getByRole("combobox", { name: "Cliente" }));
    fireEvent.click(screen.getByRole("option", { name: "ACME" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Activo" }));
    fireEvent.click(screen.getByRole("option", { name: "Retro 1" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Técnico" }));
    fireEvent.click(screen.getByRole("option", { name: "Tomás Ruiz" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "pausada" } });
    fireEvent.change(screen.getByLabelText("Prioridad"), { target: { value: "alta" } });
    fireEvent.change(screen.getByLabelText("Tipo de mantenimiento"), { target: { value: "preventivo" } });
    fireEvent.click(screen.getByRole("switch", { name: "Solo con recomendaciones de IA" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/ordenes-trabajo?buscar=fuga&clienteId=1&activoId=2&tecnicoId=7&estado=pausada&prioridad=alta&tipo=preventivo&conSugerencias=true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/ordenes-trabajo");
    expect(screen.getByLabelText("Buscar")).toHaveValue("");
  });

  it("al elegir un cliente solo ofrece sus activos y descarta el activo previo", () => {
    const otro = { ...activo, id: 5, clienteId: 9, nombre: "Pala 9" };
    render(conNavegacion(<BarraFiltrosOrdenes activos={[activo as never, otro as never]} clientes={[cliente as never]} filtros={{ ...filtrosVacios, activoId: "5" }} tecnicos={[]} />));
    expect(screen.getByRole("combobox", { name: "Activo" })).toHaveValue("Pala 9");
    fireEvent.focus(screen.getByRole("combobox", { name: "Cliente" }));
    fireEvent.click(screen.getByRole("option", { name: "ACME" }));
    expect(screen.getByRole("combobox", { name: "Activo" })).toHaveValue("");
    fireEvent.focus(screen.getByRole("combobox", { name: "Activo" }));
    expect(screen.getByRole("option", { name: "Retro 1" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Pala 9" })).not.toBeInTheDocument();
  });

  it("busca un cliente fuera de la primera página y aplica su ID descartando el activo anterior", async () => {
    s.listarClientesPaginados.mockResolvedValue(pagina([{ id: 99, razonSocial: "Cliente remoto" }]));
    render(conNavegacion(<BarraFiltrosOrdenes activos={[activo as never]} clientes={[cliente as never]} filtros={{ ...filtrosVacios, activoId: "2", estado: "pausada" }} tecnicos={[]} />));
    const entrada = screen.getByRole("combobox", { name: "Cliente" });
    fireEvent.change(entrada, { target: { value: "Cliente remoto" } });
    fireEvent.keyDown(entrada, { key: "Enter" });
    expect(replace).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("option", { name: "Cliente remoto" }));
    expect(s.listarClientesPaginados).toHaveBeenCalledWith({ buscar: "Cliente remoto", estado: "", pagina: 1 });
    expect(replace).toHaveBeenLastCalledWith("/ordenes-trabajo?clienteId=99&estado=pausada");
    expect(entrada).toHaveValue("Cliente remoto");
    expect(screen.getByRole("combobox", { name: "Activo" })).toHaveValue("");
  });

  it("bloquea un rango de fechas invertido y enfoca la fecha final", () => {
    render(conNavegacion(<BarraFiltrosOrdenes activos={[]} clientes={[]} filtros={{ ...filtrosVacios, fechaDesde: "2026-06-10", fechaHasta: "2026-06-01" }} tecnicos={[]} />));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "pausada" } });
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Creada hasta")).toHaveFocus();
  });
});

describe("OrdenesAsociadas", () => {
  it("consulta con el filtro recibido, muestra la tabla y pagina", async () => {
    s.listarOrdenesTrabajo.mockResolvedValue(pagina([orden(1, { nombreTecnico: "Tomás Ruiz" })], 2));
    render(<OrdenesAsociadas activoId="2" clienteId="" tecnicoId="" titulo="Historial" />);
    expect(screen.getByText("Cargando órdenes de trabajo…")).toBeInTheDocument();
    expect(await screen.findByText("Tomás Ruiz")).toBeInTheDocument();
    expect(s.listarOrdenesTrabajo).toHaveBeenCalledWith(expect.objectContaining({ activoId: "2", clienteId: "", pagina: 1 }));
    expect(screen.getByRole("heading", { name: "Historial" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/ordenes-trabajo/1");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(s.listarOrdenesTrabajo).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 2, activoId: "2" })));
  });

  it("muestra vacío y error", async () => {
    s.listarOrdenesTrabajo.mockResolvedValue(pagina([]));
    const { unmount } = render(<OrdenesAsociadas activoId="" clienteId="1" tecnicoId="" titulo="Órdenes" />);
    expect(await screen.findByText("No hay órdenes de trabajo asociadas.")).toBeInTheDocument();
    unmount();
    s.listarOrdenesTrabajo.mockRejectedValue(new Error("x"));
    render(<OrdenesAsociadas activoId="" clienteId="" tecnicoId="3" titulo="Órdenes" />);
    expect(await screen.findByText("No se pudieron obtener las órdenes de trabajo asociadas.")).toBeInTheDocument();
  });
});

describe("detalle de orden de trabajo", () => {
  it("excluye al técnico actual de las opciones iniciales y remotas", async () => {
    const otro = { id: 8, nombre: "Ana", apellido: "Pérez" };
    s.listarTecnicosPaginados.mockResolvedValue([tecnico, otro]);
    render(<DetalleOrdenTrabajo ordenInicial={orden(11, { tecnicoId: 7, nombreTecnico: "Tomás Ruiz" }) as never} tecnicosIniciales={[tecnico, otro] as never} huboErrorTecnicos={false} />);
    const entrada = screen.getByRole("combobox", { name: "Asignar o modificar técnico" });
    expect(entrada).toHaveValue("");
    expect(screen.getByRole("button", { name: "Confirmar técnico" })).toBeDisabled();
    fireEvent.focus(entrada);
    expect(screen.queryByRole("option", { name: "Tomás Ruiz" })).not.toBeInTheDocument();
    fireEvent.change(entrada, { target: { value: "Tomás" } });
    await waitFor(() => expect(s.listarTecnicosPaginados).toHaveBeenCalledWith("Tomás"));
    await waitFor(() => expect(screen.queryByText("Buscando…")).not.toBeInTheDocument());
    expect(screen.queryByRole("option", { name: "Tomás Ruiz" })).not.toBeInTheDocument();
    expect(s.asignarTecnicoOrdenTrabajo).not.toHaveBeenCalled();
  });

  it("al cambiar de X a Y permite volver a X y vacía la selección tras cada asignación", async () => {
    const otro = { id: 8, nombre: "Ana", apellido: "Pérez" };
    s.listarTecnicosPaginados.mockResolvedValue([tecnico, otro]);
    s.asignarTecnicoOrdenTrabajo.mockResolvedValueOnce(orden(11, { tecnicoId: 8, nombreTecnico: "Ana Pérez" }))
      .mockResolvedValueOnce(orden(11, { tecnicoId: 7, nombreTecnico: "Tomás Ruiz" }));
    render(<DetalleOrdenTrabajo ordenInicial={orden(11, { tecnicoId: 7 }) as never} tecnicosIniciales={[tecnico, otro] as never} huboErrorTecnicos={false} />);
    const entrada = screen.getByRole("combobox", { name: "Asignar o modificar técnico" });
    fireEvent.focus(entrada);
    fireEvent.click(screen.getByRole("option", { name: "Ana Pérez" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar técnico" }));
    await waitFor(() => expect(entrada).toHaveValue(""));
    expect(s.asignarTecnicoOrdenTrabajo).toHaveBeenLastCalledWith(11, "8");
    expect(screen.getByRole("button", { name: "Confirmar técnico" })).toBeDisabled();
    fireEvent.focus(entrada);
    expect(screen.queryByRole("option", { name: "Ana Pérez" })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("option", { name: "Tomás Ruiz" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar técnico" }));
    await waitFor(() => expect(s.asignarTecnicoOrdenTrabajo).toHaveBeenLastCalledWith(11, "7"));
    await waitFor(() => expect(entrada).toHaveValue(""));
  });

  beforeEach(() => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11));
  });

  it("muestra datos, historial con lo más nuevo primero y valores por defecto", async () => {
    render(await DetalleOrden(parametros("11")));
    expect(s.obtenerOrdenTrabajoServidor).toHaveBeenCalledWith(11);
    expect(screen.getByRole("heading", { level: 1, name: "Orden de trabajo N° 11" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retro 1" })).toHaveAttribute("href", "/activos/2");
    expect(screen.getByText("Sin observaciones")).toBeInTheDocument();
    expect(screen.getByText("Sin repuestos asociados")).toBeInTheDocument();
    expect(screen.getByText("Sin sugerencias")).toBeInTheDocument();
    const historial = screen.getByRole("heading", { name: "Historial de estados" }).closest("section") as HTMLElement;
    const items = within(historial).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Asignada");
    expect(items[1]).toHaveTextContent("Creada");
    expect(screen.getByTestId("evidencias")).toHaveAttribute("data-registrar", "true");
    expect(screen.getByRole("link", { name: "Modificar" })).toHaveAttribute("href", "/ordenes-trabajo/11/editar");
  });

  it("muestra repuestos y sugerencias cuando existen", async () => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(
      orden(11, { repuestos: [{ id: 3, codigo: "R3", nombre: "Filtro" }], sugerencias: ["Revisar sellos"], observaciones: "Urgente" }),
    );
    render(await DetalleOrden(parametros("11")));
    expect(screen.getByText("R3 - Filtro")).toBeInTheDocument();
    expect(screen.getByText("Revisar sellos")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("una orden cerrada es solo de consulta: sin modificar, sin técnico ni cambios de estado, sin registrar evidencias", async () => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { estado: "cerrada", estadosSiguientes: [] }));
    render(await DetalleOrden(parametros("11")));
    expect(screen.getByText("La orden está cerrada o cancelada y solo queda disponible para consulta.")).toBeInTheDocument();
    expect(screen.getByText("No hay cambios de estado disponibles para esta orden.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Modificar" })).not.toBeInTheDocument();
    expect(screen.getByTestId("evidencias")).toHaveAttribute("data-registrar", "false");
  });

  it("asigna un técnico y muestra la confirmación", async () => {
    s.asignarTecnicoOrdenTrabajo.mockResolvedValue(orden(11, { tecnicoId: 7, nombreTecnico: "Tomás Ruiz" }));
    render(await DetalleOrden(parametros("11")));
    expect(screen.getByRole("button", { name: "Confirmar técnico" })).toBeDisabled();
    fireEvent.focus(screen.getByRole("combobox", { name: "Asignar o modificar técnico" }));
    fireEvent.click(await screen.findByRole("option", { name: "Tomás Ruiz" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar técnico" }));
    await waitFor(() => expect(s.asignarTecnicoOrdenTrabajo).toHaveBeenCalledWith(11, "7"));
    expect(await screen.findByText("Técnico asignado correctamente.")).toBeInTheDocument();
  });

  it("muestra el error de la API al asignar técnico", async () => {
    s.asignarTecnicoOrdenTrabajo.mockRejectedValue(new Error("El técnico no está activo."));
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { tecnicoId: 7, nombreTecnico: "Tomás Ruiz" }));
    s.obtenerUsuarioServidor.mockResolvedValue(tecnico);
    render(await DetalleOrden(parametros("11")));
    const boton = screen.getByRole("button", { name: "Confirmar técnico" });
    s.listarTecnicosPaginados.mockResolvedValue([{ id: 8, nombre: "Ana", apellido: "Pérez" }]);
    fireEvent.change(screen.getByRole("combobox", { name: "Asignar o modificar técnico" }), { target: { value: "Ana" } });
    fireEvent.click(await screen.findByRole("option", { name: "Ana Pérez" }));
    expect(boton).toBeEnabled();
    fireEvent.click(boton);
    expect(await screen.findByText("El técnico no está activo.")).toBeInTheDocument();
  });

  it("cambia el estado: pide motivo solo si hace falta y limpia el formulario al guardar", async () => {
    s.cambiarEstadoOrdenTrabajo.mockResolvedValue(orden(11, { estado: "asignada" }));
    render(await DetalleOrden(parametros("11")));
    expect(screen.getByRole("button", { name: "Confirmar estado" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Actualizar estado"), { target: { value: "pausada" } });
    expect(screen.getByLabelText("Motivo u observación")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Actualizar estado"), { target: { value: "asignada" } });
    expect(screen.queryByLabelText("Motivo u observación")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar estado" }));
    await waitFor(() => expect(s.cambiarEstadoOrdenTrabajo).toHaveBeenCalledWith(11, "creada", "asignada", ""));
    expect(await screen.findByText("Estado actualizado correctamente.")).toBeInTheDocument();
    expect(screen.getByLabelText("Actualizar estado")).toHaveValue("");
  });

  it("muestra el error de validación del servicio al cambiar de estado sin motivo", async () => {
    s.cambiarEstadoOrdenTrabajo.mockRejectedValue(new Error("Indicá el motivo u observación del cambio de estado."));
    render(await DetalleOrden(parametros("11")));
    fireEvent.change(screen.getByLabelText("Actualizar estado"), { target: { value: "pausada" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar estado" }));
    expect(await screen.findByText("Indicá el motivo u observación del cambio de estado.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Motivo u observación"), { target: { value: "Falta repuesto" } });
    expect(screen.getByLabelText("Motivo u observación")).toHaveValue("Falta repuesto");
  });

  it("informa si la orden no existe, si el id es inválido o si falla el listado de técnicos", async () => {
    s.obtenerOrdenTrabajoServidor.mockRejectedValue(new Error("x"));
    const { unmount } = render(await DetalleOrden(parametros("11")));
    expect(screen.getByText("No se pudo obtener la información de la orden solicitada.")).toBeInTheDocument();
    unmount();

    s.obtenerOrdenTrabajoServidor.mockClear();
    const { unmount: segundo } = render(await DetalleOrden(parametros("abc")));
    expect(s.obtenerOrdenTrabajoServidor).not.toHaveBeenCalled();
    segundo();

    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11));
    s.listarTecnicosServidor.mockRejectedValue(new Error("x"));
    render(await DetalleOrden(parametros("11")));
    expect(screen.getByText("No se pudo obtener el listado de técnicos.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Orden de trabajo N° 11" })).toBeInTheDocument();
  });
});

describe("edición y alta de orden de trabajo (páginas)", () => {
  it("la edición reúne cliente, activo, técnico y repuestos de la orden y guarda con la versión leída", async () => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { tecnicoId: 7, repuestos: [{ id: 3, codigo: "R3", nombre: "Filtro" }] }));
    s.obtenerClienteServidor.mockResolvedValue({ id: 1, razonSocial: "ACME" });
    s.obtenerActivoServidor.mockResolvedValue({ id: 2, clienteId: 1, nombre: "Retro 1" });
    s.obtenerUsuarioServidor.mockResolvedValue(tecnico);
    s.obtenerRepuestoServidor.mockResolvedValue({ id: 3, codigo: "R3", nombre: "Filtro" });
    s.actualizarOrdenTrabajo.mockResolvedValue(orden(11));
    render(await EditarOrden(parametros("11")));
    const formulario = screen.getByRole("form", { name: "Formulario de orden" });
    expect(formulario).toHaveAttribute("data-orden", "11");
    expect(formulario).toHaveAttribute("data-clientes", "1");
    expect(formulario).toHaveAttribute("data-activos", "1");
    expect(formulario).toHaveAttribute("data-tecnicos", "1");
    expect(formulario).toHaveAttribute("data-repuestos", "1");
    fireEvent.click(within(formulario).getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() => expect(s.actualizarOrdenTrabajo).toHaveBeenCalledWith(11, { descripcion: "x" }, "v1"));
  });

  it("la edición informa el error de carga", async () => {
    s.obtenerOrdenTrabajoServidor.mockRejectedValue(new Error("x"));
    render(await EditarOrden(parametros("11")));
    expect(screen.getByText("No se pudo obtener la información de la orden solicitada.")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Formulario de orden" })).not.toBeInTheDocument();
  });

  it("la alta carga los datos del formulario en el servidor y crea la orden", async () => {
    s.crearOrdenTrabajo.mockResolvedValue(orden(12));
    render(await NuevaOrden());
    const formulario = screen.getByRole("form", { name: "Formulario de orden" });
    expect(formulario).toHaveAttribute("data-clientes", "1");
    expect(formulario).toHaveAttribute("data-repuestos", "1");
    fireEvent.click(within(formulario).getByRole("button", { name: "Confirmar creación" }));
    await waitFor(() => expect(s.crearOrdenTrabajo).toHaveBeenCalledWith({ descripcion: "x" }));
  });

  it("la alta informa si faltan datos", async () => {
    s.listarClientesServidor.mockRejectedValue(new Error("x"));
    render(await NuevaOrden());
    expect(screen.getByText("No se pudieron obtener los datos necesarios para crear la orden.")).toBeInTheDocument();
  });
});

describe("órdenes según el rol", () => {
  it("el técnico ve el detalle, cambia el estado y carga evidencias, pero no asigna técnico ni modifica", async () => {
    vi.mocked(tienePermisoServidor).mockImplementation(async (permiso) => permiso !== "ot.asignar_tecnico");
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { tecnicoId: 30, nombreTecnico: "Técnico Prueba", estado: "asignada", estadosSiguientes: ["en_ejecucion"] }));
    render(<ProveedorSesion usuario={usuarioDePruebas(["tecnico"])}>{await DetalleOrden(parametros("11"))}</ProveedorSesion>);

    expect(s.listarTecnicosServidor).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox", { name: "Asignar o modificar técnico" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Modificar" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Actualizar estado")).toBeInTheDocument();
    expect(screen.queryByText("No se pudo obtener el listado de técnicos.")).not.toBeInTheDocument();
  });

  it("el pañolero solo consulta: sin cambio de estado; y el listado no ofrece «Crear orden» ni modificar", async () => {
    vi.mocked(tienePermisoServidor).mockResolvedValue(false);
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11));
    render(<ProveedorSesion usuario={usuarioDePruebas(["panolero"])}>{await DetalleOrden(parametros("11"))}</ProveedorSesion>);
    expect(screen.queryByLabelText("Actualizar estado")).not.toBeInTheDocument();
    expect(screen.getByText("Estado actual: Creada.")).toBeInTheDocument();
  });

  it("sin permiso de reportes ni de usuarios, el listado no pide el resumen ni los técnicos", async () => {
    vi.mocked(tienePermisoServidor).mockResolvedValue(false);
    render(<ProveedorSesion usuario={usuarioDePruebas(["panolero"])}>{await PaginaOrdenes({ searchParams: Promise.resolve({}) })}</ProveedorSesion>);
    expect(s.obtenerIndicadoresServidor).not.toHaveBeenCalled();
    expect(s.listarTecnicosServidor).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Crear orden" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Técnico" })).not.toBeInTheDocument();
  });
});
