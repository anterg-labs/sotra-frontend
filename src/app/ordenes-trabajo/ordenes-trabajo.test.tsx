import { resolverServidor } from "@/pruebas/resolver-servidor";
import { fireEvent, render as renderBase, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { conEstadosOrden, estadosDePrueba, transicion } from "@/pruebas/estados-orden";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import { OrdenesAsociadas } from "@/componentes/ordenes-asociadas";
import { ContenidoEditarOrden as EditarOrden } from "./[id]/editar/contenido-editar-orden";
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

function render(ui: ReactElement) {
  return renderBase(conEstadosOrden(ui));
}

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const listadoSimulado = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  // Navegador (servicios de cliente)
  listarOrdenesTrabajo: vi.fn(),
  asignarTecnicoOrdenTrabajo: vi.fn(),
  cambiarEstadoOrdenTrabajo: vi.fn(),
  actualizarRepuestosOrdenTrabajo: vi.fn(),
  obtenerDetalleRepuesto: vi.fn(),
  listarRepuestosPaginados: vi.fn(),
  actualizarOrdenTrabajo: vi.fn(),
  crearOrdenTrabajo: vi.fn(),
  listarTecnicosPaginados: vi.fn(),
  listarClientesPaginados: vi.fn(),
  listarActivosPaginados: vi.fn(),
  // Servidor
  listarOrdenesTrabajoServidor: vi.fn(),
  listarEstadosOrdenTrabajoOVacio: vi.fn(),
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

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }), usePathname: () => "/ordenes-trabajo/nuevo", useSelectedLayoutSegment: () => null }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/servicios/servicio-ordenes-trabajo", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/servicios/servicio-ordenes-trabajo")>()),
  listarOrdenesTrabajo: s.listarOrdenesTrabajo,
  asignarTecnicoOrdenTrabajo: s.asignarTecnicoOrdenTrabajo,
  cambiarEstadoOrdenTrabajo: s.cambiarEstadoOrdenTrabajo,
  actualizarRepuestosOrdenTrabajo: s.actualizarRepuestosOrdenTrabajo,
  actualizarOrdenTrabajo: s.actualizarOrdenTrabajo,
  crearOrdenTrabajo: s.crearOrdenTrabajo,
  listarTecnicosPaginados: s.listarTecnicosPaginados,
}));
vi.mock("@/servicios/servicio-repuestos", () => ({
  obtenerDetalleRepuesto: s.obtenerDetalleRepuesto,
  listarRepuestosPaginados: s.listarRepuestosPaginados,
}));
vi.mock("@/servicios/servicio-clientes", () => ({ listarClientesPaginados: s.listarClientesPaginados }));
vi.mock("@/servicios/servicio-activos", () => ({ listarActivosPaginados: s.listarActivosPaginados }));
vi.mock("@/servicios/servidor/ordenes-trabajo", async (importarReal) => ({
  conTecnicoDeLaOrden: (await importarReal<typeof import("@/servicios/servidor/ordenes-trabajo")>()).conTecnicoDeLaOrden,
  listarOrdenesTrabajoServidor: s.listarOrdenesTrabajoServidor,
  obtenerOrdenTrabajoServidor: s.obtenerOrdenTrabajoServidor,
  listarTecnicosServidor: s.listarTecnicosServidor,
  listarEstadosOrdenTrabajoOVacio: s.listarEstadosOrdenTrabajoOVacio,
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
  id, clienteId: 1, nombreCliente: "ACME", activoId: 2, nombreActivo: "Retro 1", responsableId: 4, nombreResponsable: "Ana Pérez",
  tecnicoId: null, nombreTecnico: null,
  tipo: "correctivo", prioridad: "alta", descripcion: "Cambiar filtro", observaciones: "", fechaPrevistaEjecucion: "2026-10-20",
  estado: "pendiente", creadoEn: "2026-10-01T10:00:00Z", fechaInicio: null, fechaCierre: null, sugerencias: [], repuestos: [],
  transiciones: [transicion("en_progreso"), transicion("pausado", { exigeMotivo: true })],
  historialEstados: [
    { estado: "pendiente", estadoAnterior: null, fechaHora: "2026-10-01T10:00:00Z", observacion: "Alta", usuarioId: null, nombreUsuario: null },
    { estado: "en_progreso", estadoAnterior: "pendiente", fechaHora: "2026-10-02T10:00:00Z", observacion: "Arranca el trabajo", usuarioId: 4, nombreUsuario: "Ana Pérez" },
  ],
  historialRepuestos: [],
  historialTecnicos: [
    { tecnicoAnteriorId: 8, nombreTecnicoAnterior: "Luis Gómez", tecnicoId: 7, nombreTecnico: "Tomás Ruiz", fechaHora: "2026-10-02T09:00:00Z", usuarioId: 4, nombreUsuario: "Ana Pérez", observacion: null },
  ],
  version: "v1",
  ...extra,
});
/** Repuesto R3: 10 en stock y 3 reservadas (las de esta orden), o sea 7 disponibles; la orden puede pedir hasta 7 + 3 = 10. */
const repuestoConStock = (extra: Record<string, unknown> = {}) => ({
  id: 3, codigo: "R3", nombre: "Filtro", descripcion: "", marca: "", ubicacion: "", categoria: "", modeloCompatibilidad: "", unidadMedida: "unidad", observaciones: "", cantidad: 10, cantidadMinima: 2,
  cantidadReservada: 3, cantidadEntregada: 0, cantidadDisponible: 7, estado: "activo", estadoStock: "normal", ...extra,
});
const tecnico = { id: 7, nombre: "Tomás", apellido: "Ruiz" };
const cliente = { id: 1, razonSocial: "ACME", estado: "activo" };
const activo = { id: 2, clienteId: 1, nombre: "Retro 1", numSerie: "S1", estado: "activo" };
const resumen = { totalOrdenes: 30, ordenesPorEstado: [{ nombre: "pendiente", cantidad: 5 }, { nombre: "cerrado", cantidad: 9 }] };
const filtrosVacios = {
  buscar: "", clienteId: "", activoId: "", tecnicoId: "", estado: "", fase: "", prioridad: "", tipo: "",
  fechaDesde: "", fechaHasta: "", soloActivas: false, sinAsignar: false, conSugerencias: false, vista: "", mes: "", meses: "", eliminadas: false, pagina: 1,
};
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando…">{ui}</ProveedorNavegacionListado>;
const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  [...Object.values(s), push, replace, listadoSimulado].forEach((f) => f.mockReset());
  s.listarOrdenesTrabajoServidor.mockResolvedValue(pagina([orden(1), orden(2, { estado: "cerrado", nombreTecnico: "Tomás Ruiz" })]));
  s.obtenerIndicadoresServidor.mockResolvedValue(resumen);
  s.listarClientesServidor.mockResolvedValue(pagina([cliente]));
  s.listarActivosServidor.mockResolvedValue(pagina([activo]));
  s.listarTecnicosServidor.mockResolvedValue([tecnico]);
  s.listarEstadosOrdenTrabajoOVacio.mockResolvedValue(estadosDePrueba);
  s.listarRepuestosServidor.mockResolvedValue(pagina([{ id: 3, codigo: "R3", nombre: "Filtro" }]));
  s.listarTecnicosPaginados.mockResolvedValue([tecnico]);
});

describe("filtros de la URL de órdenes", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosOrdenes({}, estadosDePrueba)).toEqual(filtrosVacios);
    expect(
      leerFiltrosOrdenes({
        buscar: "fuga", clienteId: "1", activoId: "2", tecnicoId: "7", estado: "pausado", prioridad: "alta", tipo: "preventivo",
        fechaDesde: "2026-10-01", fechaHasta: "2026-10-31", conSugerencias: "true", pagina: "2",
      }, estadosDePrueba),
    ).toEqual({
      buscar: "fuga", clienteId: "1", activoId: "2", tecnicoId: "7", estado: "pausado", fase: "", prioridad: "alta", tipo: "preventivo",
      fechaDesde: "2026-10-01", fechaHasta: "2026-10-31", soloActivas: false, sinAsignar: false, conSugerencias: true, vista: "", mes: "", meses: "", eliminadas: false, pagina: 2,
    });
    expect(leerFiltrosOrdenes({ vista: "calendario", mes: "2026-11", meses: "3", eliminadas: "true" }, estadosDePrueba)).toMatchObject({ vista: "calendario", mes: "2026-11", meses: "3", eliminadas: true });
    expect(leerFiltrosOrdenes({ vista: "x", mes: "2026-13", meses: "9", eliminadas: "si" }, estadosDePrueba)).toMatchObject({ vista: "", mes: "", meses: "", eliminadas: false });
    expect(construirUrlOrdenes({ ...filtrosVacios, vista: "calendario", mes: "2026-11", eliminadas: true })).toBe("/ordenes-trabajo?vista=calendario&mes=2026-11&eliminadas=true");
    expect(leerFiltrosOrdenes({ fase: "en_curso" }, estadosDePrueba).fase).toBe("en_curso");
    expect(leerFiltrosOrdenes({ soloActivas: "true" }, estadosDePrueba).soloActivas).toBe(true);
    expect(leerFiltrosOrdenes({ soloActivas: "si" }, estadosDePrueba).soloActivas).toBe(false);
    expect(leerFiltrosOrdenes({ sinAsignar: "true" }, estadosDePrueba).sinAsignar).toBe(true);
    expect(leerFiltrosOrdenes({ sinAsignar: "si" }, estadosDePrueba).sinAsignar).toBe(false);
    expect(construirUrlOrdenes({ ...filtrosVacios, sinAsignar: true })).toBe("/ordenes-trabajo?sinAsignar=true");
    expect(construirUrlOrdenes({ ...filtrosVacios, clienteId: "3", soloActivas: true })).toBe("/ordenes-trabajo?clienteId=3&soloActivas=true");
    expect(leerFiltrosOrdenes({ fase: "inventada" }, estadosDePrueba).fase).toBe("");
    expect(construirUrlOrdenes({ ...filtrosVacios, fase: "por_validar" })).toBe("/ordenes-trabajo?fase=por_validar");
    expect(leerFiltrosOrdenes({ estado: "x", prioridad: "urgente", tipo: "otro", fechaDesde: "ayer", conSugerencias: "si", clienteId: "1;" }, estadosDePrueba)).toEqual(filtrosVacios);
    expect(construirUrlOrdenes({ ...filtrosVacios, estado: "pausado", conSugerencias: true, pagina: 2 })).toBe(
      "/ordenes-trabajo?estado=pausado&conSugerencias=true&pagina=2",
    );
  });
});

describe("página del listado de órdenes (Server Component)", () => {
  it("lee searchParams, completa las opciones elegidas y muestra las tarjetas de resumen", async () => {
    vi.resetModules();
    s.obtenerUsuarioServidor.mockResolvedValue({ id: 99, nombre: "Luis", apellido: "Gómez" });
    vi.doMock("./listado-ordenes", () => ({ ListadoOrdenes: (props: unknown) => { listadoSimulado(props); return <p>Listado simulado</p>; } }));
    const { default: Pagina } = await import("./page");
    // Tras `resetModules` el contexto es otro: el proveedor tiene que salir del mismo módulo que la página.
    const { conEstadosOrden: conEstadosDeEstaCarga } = await import("@/pruebas/estados-orden");
    renderBase(conEstadosDeEstaCarga(await Pagina({ searchParams: Promise.resolve({ tecnicoId: "99", estado: "pausado", pagina: "2" }) })));
    expect(s.obtenerUsuarioServidor).toHaveBeenCalledWith(99);
    expect(screen.getByRole("heading", { level: 1, name: "Órdenes de trabajo" })).toBeInTheDocument();
    const tarjetas = screen.getByRole("region", { name: "Resumen de órdenes de trabajo" });
    expect(within(tarjetas).getByText("30")).toBeInTheDocument();
    expect(within(tarjetas).getByText("5")).toBeInTheDocument();
    expect(within(tarjetas).getByText("9")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Técnico" })).toHaveValue("Luis Gómez");
    expect(screen.getByLabelText("Estado")).toHaveValue("pausado");
    expect(screen.getByRole("link", { name: "Crear orden" })).toHaveAttribute("href", "/ordenes-trabajo/nuevo");
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
    expect(listadoSimulado).toHaveBeenCalledWith({ consulta: expect.any(Promise), filtros: { ...filtrosVacios, tecnicoId: "99", estado: "pausado", pagina: 2 } });
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
    expect(within(filas[1]).getByText("Pendiente")).toBeInTheDocument();
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
    render(conNavegacion(await ListadoOrdenes({ filtros: { ...filtrosVacios, estado: "pausado", conSugerencias: true } })));
    expect(screen.getByText("Página 1 de 3 (1 órdenes)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/ordenes-trabajo?estado=pausado&conSugerencias=true&pagina=2");
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
    expect(screen.queryByRole("combobox", { name: "Cliente" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filtros avanzados" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Cliente" }));
    fireEvent.click(screen.getByRole("option", { name: "ACME" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Activo" }));
    fireEvent.click(screen.getByRole("option", { name: "Retro 1" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Técnico" }));
    fireEvent.click(screen.getByRole("option", { name: "Tomás Ruiz" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "pausado" } });
    fireEvent.change(screen.getByLabelText("Prioridad"), { target: { value: "alta" } });
    fireEvent.change(screen.getByLabelText("Tipo de mantenimiento"), { target: { value: "preventivo" } });
    fireEvent.click(screen.getByRole("switch", { name: "Solo con recomendaciones de IA" }));
    expect(replace).toHaveBeenLastCalledWith(
      "/ordenes-trabajo?buscar=fuga&clienteId=1&activoId=2&tecnicoId=7&estado=pausado&prioridad=alta&tipo=preventivo&conSugerencias=true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/ordenes-trabajo");
    expect(screen.getByLabelText("Buscar")).toHaveValue("");
  });

  it("mantiene Solo sin asignar al buscar y lo quita al limpiar", async () => {
    render(conNavegacion(<BarraFiltrosOrdenes activos={[]} clientes={[]} filtros={{ ...filtrosVacios, sinAsignar: true }} tecnicos={[]} />));
    expect(screen.getByRole("switch", { name: "Solo sin asignar" })).toBeChecked();
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "fuga" } });
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/ordenes-trabajo");
    expect(screen.getByRole("switch", { name: "Solo sin asignar" })).not.toBeChecked();
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
    render(conNavegacion(<BarraFiltrosOrdenes activos={[activo as never]} clientes={[cliente as never]} filtros={{ ...filtrosVacios, activoId: "2", estado: "pausado" }} tecnicos={[]} />));
    const entrada = screen.getByRole("combobox", { name: "Cliente" });
    fireEvent.change(entrada, { target: { value: "Cliente remoto" } });
    fireEvent.keyDown(entrada, { key: "Enter" });
    expect(replace).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("option", { name: "Cliente remoto" }));
    expect(s.listarClientesPaginados).toHaveBeenCalledWith({ buscar: "Cliente remoto", estado: "", pagina: 1 });
    expect(replace).toHaveBeenLastCalledWith("/ordenes-trabajo?clienteId=99&estado=pausado");
    expect(entrada).toHaveValue("Cliente remoto");
    expect(screen.getByRole("combobox", { name: "Activo" })).toHaveValue("");
  });

  it("bloquea un rango de fechas invertido (por ejemplo desde la URL) y enfoca el selector de fecha", () => {
    render(conNavegacion(<BarraFiltrosOrdenes activos={[]} clientes={[]} filtros={{ ...filtrosVacios, fechaDesde: "2026-06-10", fechaHasta: "2026-06-01" }} tecnicos={[]} />));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "pausado" } });
    expect(replace).not.toHaveBeenCalled();
    expect(document.getElementById("fechaCreacion")).toHaveFocus();
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

function elegirEstado(etiqueta: string) {
  fireEvent.focus(screen.getByRole("combobox", { name: "Actualizar estado" }));
  fireEvent.click(screen.getByRole("option", { name: etiqueta }));
}

describe("detalle de orden de trabajo", () => {
  it("ofrece solo los estados a los que se puede pasar desde el actual, con las etiquetas y el orden del catálogo", () => {
    render(<DetalleOrdenTrabajo ordenInicial={orden(11, { estado: "en_revision", transiciones: [transicion("en_progreso", { exigeMotivo: true }), transicion("cerrado", { exigeMotivo: true })] }) as never} tecnicosIniciales={[]} huboErrorTecnicos={false} />);
    fireEvent.focus(screen.getByRole("combobox", { name: "Actualizar estado" }));

    expect(screen.getAllByRole("option").map((opcion) => opcion.textContent)).toEqual(["En progreso", "Cerrado"]);
    expect(screen.queryByRole("option", { name: "Pausado" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar estado" })).toBeDisabled();
    fireEvent.click(screen.getByRole("option", { name: "Cerrado" }));
    expect(screen.getByRole("button", { name: "Confirmar estado" })).toBeEnabled();
  });

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
    expect(screen.getByText("Creada por")).toBeInTheDocument();
    expect(within(screen.getByText("Creada por").closest("div") as HTMLElement).getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Sin repuestos asociados")).toBeInTheDocument();
    expect(screen.getByText("Sin sugerencias")).toBeInTheDocument();
    const historial = screen.getByRole("heading", { name: "Historial de estados" }).closest("section") as HTMLElement;
    const items = within(historial).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Pendiente → En progreso");
    expect(items[0]).toHaveTextContent("Ana Pérez");
    expect(items[0]).toHaveTextContent("Arranca el trabajo");
    expect(items[1]).toHaveTextContent("Pendiente");
    expect(items[1]).not.toHaveTextContent("→");
    const tecnicos = screen.getByRole("heading", { name: "Historial de técnicos" }).closest("section") as HTMLElement;
    expect(within(tecnicos).getByRole("listitem")).toHaveTextContent("Luis Gómez → Tomás Ruiz");
    expect(within(tecnicos).getByRole("listitem")).toHaveTextContent("Ana Pérez");
    expect(screen.getByTestId("evidencias")).toHaveAttribute("data-registrar", "true");
    expect(screen.getByRole("link", { name: "Modificar" })).toHaveAttribute("href", "/ordenes-trabajo/11/editar");
  });

  it("muestra repuestos y sugerencias cuando existen", async () => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(
      orden(11, {
        repuestos: [{ id: 3, codigo: "R3", nombre: "Filtro", cantidad: 3, estado: "reservado" }],
        historialRepuestos: [{
          repuestoId: 3, codigo: "R3", nombre: "Filtro", accion: "reservar", cantidadAnterior: null, cantidadNueva: 3,
          estadoAnterior: null, estadoNuevo: "reservado", fechaHora: "2026-10-02T10:00:00Z", usuarioId: 4, nombreUsuario: "Ana Pérez",
        }],
        sugerencias: ["Revisar sellos"], observaciones: "Urgente",
      }),
    );
    s.obtenerRepuestoServidor.mockResolvedValue(repuestoConStock());
    render(await DetalleOrden(parametros("11")));
    expect(screen.getByText("R3 - Filtro · 3 u. · Reservado")).toBeInTheDocument();
    const repuestos = screen.getByRole("table", { name: "Repuestos de la orden" });
    expect(within(repuestos).getByText("Reservado")).toBeInTheDocument();
    const historial = screen.getByRole("list", { name: "Historial de repuestos" });
    expect(within(historial).getByText("Reservó R3 - Filtro")).toBeInTheDocument();
    expect(within(historial).getByText(/Ana Pérez/)).toBeInTheDocument();
    expect(screen.getByText("Revisar sellos")).toBeInTheDocument();
    expect(screen.getByText("Urgente")).toBeInTheDocument();
  });

  it("quien gestiona repuestos cambia la cantidad con el selector numérico, la guarda y ve el resultado", async () => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { repuestos: [{ id: 3, codigo: "R3", nombre: "Filtro", cantidad: 3, estado: "reservado" }] }));
    s.obtenerRepuestoServidor.mockResolvedValue(repuestoConStock());
    s.obtenerDetalleRepuesto.mockResolvedValue(repuestoConStock({ cantidadReservada: 5, cantidadDisponible: 3 }));
    s.actualizarRepuestosOrdenTrabajo.mockResolvedValue(orden(11, { repuestos: [{ id: 3, codigo: "R3", nombre: "Filtro", cantidad: 5, estado: "reservado" }] }));
    render(await DetalleOrden(parametros("11")));
    const cantidad = screen.getByLabelText("Cantidad de R3");
    expect(cantidad).toHaveValue(3);
    expect(cantidad).toHaveAttribute("max", "10");
    expect(screen.getByRole("button", { name: "Guardar repuestos" })).toBeDisabled();

    fireEvent.change(cantidad, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar repuestos" }));

    await waitFor(() => expect(s.actualizarRepuestosOrdenTrabajo).toHaveBeenCalledWith(11, [{ repuestoId: 3, cantidad: 5 }]));
    expect(await screen.findByText("Repuestos actualizados correctamente.")).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Repuestos de la orden" })).getByText("5")).toBeInTheDocument();
    expect(s.obtenerDetalleRepuesto).toHaveBeenCalledWith(3);
  });

  it("si la API rechaza los repuestos por falta de stock, muestra su mensaje y no cambia la orden", async () => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { repuestos: [{ id: 3, codigo: "R3", nombre: "Filtro", cantidad: 3, estado: "reservado" }] }));
    s.obtenerRepuestoServidor.mockResolvedValue(repuestoConStock());
    s.actualizarRepuestosOrdenTrabajo.mockRejectedValue(new Error("No hay unidades disponibles de R3 - Filtro: hay 10 en stock, 7 reservadas por otras órdenes; quedan 3 y se necesitan 6."));
    render(await DetalleOrden(parametros("11")));

    fireEvent.change(screen.getByLabelText("Cantidad de R3"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar repuestos" }));

    expect(await screen.findByText(/No hay unidades disponibles de R3 - Filtro: hay 10 en stock/)).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Repuestos de la orden" })).getByText("3")).toBeInTheDocument();
  });

  it("no deja pasar de lo disponible ni llama a la API", async () => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { repuestos: [{ id: 3, codigo: "R3", nombre: "Filtro", cantidad: 3, estado: "reservado" }] }));
    s.obtenerRepuestoServidor.mockResolvedValue(repuestoConStock());
    render(await DetalleOrden(parametros("11")));

    fireEvent.change(screen.getByLabelText("Cantidad de R3"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar repuestos" }));

    expect((await screen.findAllByText(/Solo hay 10 disponibles de R3 - Filtro/)).length).toBeGreaterThan(0);
    expect(s.actualizarRepuestosOrdenTrabajo).not.toHaveBeenCalled();
  });

  it("una orden cerrada es solo de consulta: sin modificar, sin técnico ni cambios de estado, sin registrar evidencias", async () => {
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { estado: "cerrado", transiciones: [] }));
    render(await DetalleOrden(parametros("11")));
    expect(screen.queryByRole("button", { name: "Guardar repuestos" })).not.toBeInTheDocument();
    expect(screen.getByText("La orden está cerrada o eliminada y solo queda disponible para consulta.")).toBeInTheDocument();
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
    s.cambiarEstadoOrdenTrabajo.mockResolvedValue(orden(11, { estado: "en_progreso" }));
    render(await DetalleOrden(parametros("11")));
    expect(screen.getByRole("button", { name: "Confirmar estado" })).toBeDisabled();

    elegirEstado("Pausado");
    expect(screen.getByLabelText("Motivo u observación")).toBeInTheDocument();
    elegirEstado("En progreso");
    expect(screen.queryByLabelText("Motivo u observación")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar estado" }));
    await waitFor(() => expect(s.cambiarEstadoOrdenTrabajo).toHaveBeenCalledWith(11, "en_progreso", "", false, {}));
    expect(await screen.findByText("Estado actualizado correctamente.")).toBeInTheDocument();
    expect(screen.getByLabelText("Actualizar estado")).toHaveValue("");
  });

  it("sin motivo, el error queda junto al campo de motivo, con el foco, y no llama a la API", async () => {
    render(await DetalleOrden(parametros("11")));
    elegirEstado("Pausado");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar estado" }));

    const error = await screen.findByText("Indicá el motivo u observación del cambio de estado.");
    expect(error).toHaveAttribute("id", "motivoCambioEstado-error");
    expect(error).toHaveClass("field-error");
    expect(screen.getByLabelText("Motivo u observación")).toHaveFocus();
    expect(s.cambiarEstadoOrdenTrabajo).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Motivo u observación"), { target: { value: "Falta repuesto" } });
    expect(screen.queryByText("Indicá el motivo u observación del cambio de estado.")).not.toBeInTheDocument();
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
    render(await resolverServidor(await EditarOrden(parametros("11"))));
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
    render(await resolverServidor(await EditarOrden(parametros("11"))));
    expect(screen.getByText("No se pudo obtener la información de la orden solicitada.")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Formulario de orden" })).not.toBeInTheDocument();
  });

  it("la alta carga los datos del formulario en el servidor y crea la orden", async () => {
    s.crearOrdenTrabajo.mockResolvedValue(orden(12));
    render(await resolverServidor(await NuevaOrden()));
    const formulario = screen.getByRole("form", { name: "Formulario de orden" });
    expect(formulario).toHaveAttribute("data-clientes", "1");
    expect(formulario).toHaveAttribute("data-repuestos", "1");
    fireEvent.click(within(formulario).getByRole("button", { name: "Confirmar creación" }));
    await waitFor(() => expect(s.crearOrdenTrabajo).toHaveBeenCalledWith({ descripcion: "x" }));
  });

  it("la alta informa si faltan datos", async () => {
    s.listarClientesServidor.mockRejectedValue(new Error("x"));
    render(await resolverServidor(await NuevaOrden()));
    expect(screen.getByText("No se pudieron obtener los datos necesarios para crear la orden.")).toBeInTheDocument();
  });
});

describe("órdenes según el rol", () => {
  it("el técnico ve el detalle, cambia el estado y carga evidencias, pero no asigna técnico ni modifica", async () => {
    vi.mocked(tienePermisoServidor).mockImplementation(async (permiso) => permiso !== "ot.asignar_tecnico");
    s.obtenerOrdenTrabajoServidor.mockResolvedValue(orden(11, { tecnicoId: 30, nombreTecnico: "Técnico Prueba", estado: "en_progreso", transiciones: [transicion("en_progreso")] }));
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
    expect(screen.getByText("Estado actual: Pendiente.")).toBeInTheDocument();
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
