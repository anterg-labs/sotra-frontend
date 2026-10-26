import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { construirUrlClientes, leerFiltrosClientes } from "./filtros";
import { ListadoClientes } from "./listado-clientes";
import { TablaClientes } from "./tabla-clientes";
import { BarraFiltrosClientes } from "./barra-filtros-clientes";
import { AltaCliente } from "./alta-cliente";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
const listarClientesServidor = vi.hoisted(() => vi.fn());
const cambiarEstadoClienteAccion = vi.hoisted(() => vi.fn());
const crearClienteAccion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));
vi.mock("@/servicios/servidor/clientes", () => ({ listarClientesServidor }));
vi.mock("./acciones", () => ({ cambiarEstadoClienteAccion, crearClienteAccion }));

function cliente(id: number, estado: "activo" | "inactivo" = "activo") {
  return {
    id,
    razonSocial: "Cliente " + id,
    nombreContacto: "Contacto " + id,
    correo: `c${id}@mail.com`,
    telefono: "099000" + id,
    direccion: null,
    observaciones: null,
    cantidadActivosAsociados: id,
    cantidadOrdenesAsociadas: 0,
    estado,
    creadoEn: "2026-01-01T00:00:00Z",
  };
}

function pagina(elementos: ReturnType<typeof cliente>[], extra: Partial<{ pagina: number; totalPaginas: number; totalElementos: number }> = {}) {
  return { elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1, ...extra };
}

function conNavegacion(ui: React.ReactNode) {
  return <ProveedorNavegacionListado etiquetaCarga="Cargando clientes…">{ui}</ProveedorNavegacionListado>;
}

const filtrosVacios = { buscar: "", estado: "", pagina: 1 };

beforeEach(() => {
  [push, replace, mostrarAviso, listarClientesServidor, cambiarEstadoClienteAccion, crearClienteAccion].forEach((f) => f.mockReset());
  listarClientesServidor.mockResolvedValue(pagina([cliente(1), cliente(2, "inactivo")]));
});

describe("filtros de la URL", () => {
  it("muestra cero y el total de órdenes del cliente y permite ordenar por esa columna", () => {
    render(conNavegacion(<TablaClientes filtros={filtrosVacios} clientes={[cliente(1), { ...cliente(2), cantidadOrdenesAsociadas: 4 }]} />));
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByRole("cell", { name: "0" })).toBeInTheDocument();
    expect(within(filas[2]).getByRole("cell", { name: "4" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Órdenes de trabajo/ }));
    expect(push).toHaveBeenLastCalledWith(expect.stringContaining("ordenarPor=cantidadOrdenesAsociadas"));
    expect(leerFiltrosClientes({ ordenarPor: "cantidadOrdenesAsociadas" }).ordenarPor).toBe("cantidadOrdenesAsociadas");
  });
  it("lee buscar, estado y página con valores seguros por defecto", () => {
    expect(leerFiltrosClientes({})).toMatchObject(filtrosVacios);
    expect(leerFiltrosClientes({ buscar: "acme", estado: "inactivo", pagina: "3" })).toMatchObject({ buscar: "acme", estado: "inactivo", pagina: 3 });
    expect(leerFiltrosClientes({ buscar: ["a", "b"], estado: "otro", pagina: "-2" })).toMatchObject({ buscar: "a", estado: "", pagina: 1 });
    expect(leerFiltrosClientes({ pagina: "1.5" }).pagina).toBe(1);
    expect(leerFiltrosClientes({ pagina: "abc" }).pagina).toBe(1);
  });

  it("construye la URL omitiendo lo vacío y la página 1", () => {
    expect(construirUrlClientes(filtrosVacios)).toBe("/clientes");
    expect(construirUrlClientes({ buscar: " a&b ", estado: "activo", pagina: 2 })).toBe("/clientes?buscar=a%26b&estado=activo&pagina=2");
  });
});

describe("listado de clientes (Server Component)", () => {
  it("trae la página con los filtros y muestra la tabla con acciones según el estado", async () => {
    render(conNavegacion(await ListadoClientes({ filtros: { buscar: "x", estado: "activo", pagina: 2 } })));
    expect(listarClientesServidor).toHaveBeenCalledWith({ buscar: "x", estado: "activo", pagina: 2 });

    const filas = screen.getAllByRole("row");
    expect(filas).toHaveLength(3);
    const activo = within(filas[1]);
    expect(activo.getByText("Cliente 1")).toBeInTheDocument();
    expect(activo.getByText("Activo")).toBeInTheDocument();
    expect(activo.getByRole("link", { name: "Modificar cliente" })).toHaveAttribute("href", "/clientes/1/editar");
    expect(activo.getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/clientes/1");
    expect(activo.getByRole("button", { name: "Dar de baja" })).toBeInTheDocument();

    const inactivo = within(filas[2]);
    expect(inactivo.getByText("Inactivo")).toBeInTheDocument();
    expect(inactivo.getByRole("button", { name: "Reactivar cliente" })).toBeInTheDocument();
    expect(inactivo.queryByRole("button", { name: "Dar de baja" })).not.toBeInTheDocument();
  });

  it("informa el error de carga sin detalles técnicos", async () => {
    listarClientesServidor.mockRejectedValue(new Error("ECONNREFUSED 10.0.0.1"));
    render(conNavegacion(await ListadoClientes({ filtros: filtrosVacios })));
    expect(screen.getByText("No se pudo obtener el listado de clientes.")).toBeInTheDocument();
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay resultados", async () => {
    listarClientesServidor.mockResolvedValue(pagina([]));
    render(conNavegacion(await ListadoClientes({ filtros: filtrosVacios })));
    expect(screen.getByText("No se encontraron clientes con los filtros aplicados.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra la paginación solo si hay más de una página", async () => {
    const { unmount } = render(conNavegacion(await ListadoClientes({ filtros: filtrosVacios })));
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
    unmount();

    listarClientesServidor.mockResolvedValue(pagina([cliente(1)], { totalPaginas: 3, totalElementos: 41 }));
    render(conNavegacion(await ListadoClientes({ filtros: filtrosVacios })));
    expect(screen.getByText("Página 1 de 3 (41 clientes)")).toBeInTheDocument();
  });
});

describe("barra de filtros (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("el texto busca una sola vez tras el retardo y vuelve a la página 1, sin botón «Aplicar filtros»", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosClientes filtros={{ buscar: "", estado: "", pagina: 4 }} />));
    expect(screen.queryByRole("button", { name: "Aplicar filtros" })).not.toBeInTheDocument();
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "a" } });
    fireEvent.change(buscar, { target: { value: "acme" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/clientes?buscar=acme");
    expect(push).not.toHaveBeenCalled();
  });

  it("el estado se aplica al instante, conservando el texto escrito", () => {
    render(conNavegacion(<BarraFiltrosClientes filtros={filtrosVacios} />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "acme" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "inactivo" } });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenLastCalledWith("/clientes?buscar=acme&estado=inactivo");
  });

  it("el interruptor de activos asociados se aplica al instante y se lee de la URL", () => {
    expect(leerFiltrosClientes({ conActivos: "true" }).conActivos).toBe(true);
    expect(leerFiltrosClientes({ conActivos: "otro" }).conActivos).toBe(false);
    expect(construirUrlClientes({ ...filtrosVacios, conActivos: true })).toBe("/clientes?conActivos=true");
    render(conNavegacion(<BarraFiltrosClientes filtros={filtrosVacios} />));
    fireEvent.click(screen.getByRole("switch", { name: "Solo con activos asociados" }));
    expect(replace).toHaveBeenLastCalledWith("/clientes?conActivos=true");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/clientes");
  });

  it("limpia los campos y vuelve al listado sin filtros", () => {
    render(conNavegacion(<BarraFiltrosClientes filtros={{ buscar: "acme", estado: "activo", pagina: 1 }} />));
    expect(screen.getByLabelText("Buscar")).toHaveValue("acme");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/clientes");
    expect(screen.getByLabelText("Buscar")).toHaveValue("");
    expect(screen.getByLabelText("Estado")).toHaveValue("");
  });

  it("indica la búsqueda en curso de forma accesible mientras navega", async () => {
    let terminar: () => void = () => undefined;
    replace.mockImplementation(() => new Promise<void>((resolver) => { terminar = resolver; }));
    render(conNavegacion(<BarraFiltrosClientes filtros={filtrosVacios} />));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activo" } });
    expect(await screen.findByText("Cargando…")).toBeInTheDocument();
    expect(screen.getByLabelText("Búsqueda y filtros")).toHaveAttribute("aria-busy", "true");
    await act(async () => terminar());
  });
});

describe("navegación del listado", () => {
  it("deja la tabla anterior a la vista mientras el servidor prepara la nueva página, sin desmontar la barra", async () => {
    let terminar: () => void = () => undefined;
    replace.mockImplementation(() => new Promise<void>((resolver) => { terminar = resolver; }));
    render(
      conNavegacion(
        <>
          <BarraFiltrosClientes filtros={filtrosVacios} />
          <ZonaListado>
            <p>Tabla anterior</p>
          </ZonaListado>
        </>,
      ),
    );
    const estado = screen.getByLabelText("Estado");
    expect(screen.getByText("Tabla anterior")).toBeInTheDocument();
    fireEvent.change(estado, { target: { value: "activo" } });
    expect(await screen.findByRole("status", { name: "Cargando clientes…" })).toBeInTheDocument();
    expect(screen.getByText("Tabla anterior")).toBeVisible();
    expect(screen.getByText("Tabla anterior").parentElement).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Estado")).toBe(estado);
    await act(async () => terminar());
    expect(await screen.findByText("Tabla anterior")).toBeInTheDocument();
  });
});

describe("tabla de clientes (baja y reactivación)", () => {
  const clientes = [cliente(1), cliente(2, "inactivo")];

  it("pide confirmación antes de dar de baja y llama a la acción", async () => {
    cambiarEstadoClienteAccion.mockResolvedValue({ exito: true });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaClientes clientes={clientes} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));

    const dialogo = screen.getByRole("dialog", { name: "Dar de baja cliente" });
    expect(dialogo).toHaveTextContent("Cliente 1");
    expect(cambiarEstadoClienteAccion).not.toHaveBeenCalled();

    fireEvent.click(within(dialogo).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(cambiarEstadoClienteAccion).toHaveBeenCalledWith(1, "inactivo"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("marca la fila en proceso de inmediato (optimista) y muestra el estado nuevo recién cuando el servidor responde", async () => {
    let resolver: (r: { exito: true }) => void = () => undefined;
    cambiarEstadoClienteAccion.mockReturnValue(new Promise((resolve) => { resolver = resolve; }));
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaClientes clientes={clientes} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Dar de baja" }));

    await waitFor(() => expect(screen.getAllByRole("row")[1]).toHaveAttribute("aria-busy", "true"));
    expect(within(screen.getAllByRole("row")[1]).getByRole("button", { name: "Dar de baja" })).toBeDisabled();
    expect(within(screen.getAllByRole("row")[1]).getByText("Activo")).toBeInTheDocument();
    await act(async () => resolver({ exito: true }));
    await waitFor(() => expect(screen.getAllByRole("row")[1]).not.toHaveAttribute("aria-busy"));
  });

  it("cancelar la baja no llama a la acción", () => {
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaClientes clientes={clientes} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cambiarEstadoClienteAccion).not.toHaveBeenCalled();
  });

  it("muestra el error si falla la baja o la reactivación y revierte el estado", async () => {
    cambiarEstadoClienteAccion
      .mockResolvedValueOnce({ exito: false, mensaje: "No se pudo dar de baja al cliente seleccionado." })
      .mockResolvedValueOnce({ exito: false, mensaje: "No se pudo reactivar al cliente seleccionado." });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaClientes clientes={clientes} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("error", "No se pudo dar de baja al cliente seleccionado."));
    await waitFor(() => expect(within(screen.getAllByRole("row")[1]).getByText("Activo")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Reactivar cliente" }));
    fireEvent.click(within(await screen.findByRole("dialog", { name: "Reactivar cliente" })).getByRole("button", { name: "Reactivar" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("error", "No se pudo reactivar al cliente seleccionado."));
  });

  it("pide confirmación antes de reactivar un cliente inactivo y luego avisa", async () => {
    cambiarEstadoClienteAccion.mockResolvedValue({ exito: true });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaClientes clientes={clientes} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Reactivar cliente" }));
    const dialogo = screen.getByRole("dialog", { name: "Reactivar cliente" });
    expect(cambiarEstadoClienteAccion).not.toHaveBeenCalled();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Reactivar" }));
    await waitFor(() => expect(cambiarEstadoClienteAccion).toHaveBeenCalledWith(2, "activo"));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Cliente reactivado."));
  });

  it("cancelar la reactivación no llama a la acción", () => {
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaClientes clientes={clientes} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Reactivar cliente" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(cambiarEstadoClienteAccion).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resalta la fila del cliente recién registrado", () => {
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaClientes clientes={clientes} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    act(() => marcarCreado("clientes", 2));
    expect(screen.getAllByRole("row")[2]).toHaveClass("fila-nueva");
    expect(screen.getAllByRole("row")[1]).not.toHaveClass("fila-nueva");
  });
});

describe("alta de cliente", () => {
  it("abre el alta en un modal accesible y, al guardar, cierra, resalta y avisa", async () => {
    crearClienteAccion.mockResolvedValue({ exito: true, registro: cliente(9) });
    render(<AltaCliente />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar nuevo cliente" }));
    const dialogo = await screen.findByRole("dialog", { name: "Registrar nuevo cliente" });
    fireEvent.change(within(dialogo).getByLabelText("Nombre o razón social"), { target: { value: "Cliente 9" } });
    fireEvent.change(within(dialogo).getByLabelText("Nombre de contacto"), { target: { value: "Contacto 9" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar registro" }));

    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Cliente registrado."));
    expect(crearClienteAccion).toHaveBeenCalledWith(expect.objectContaining({ razonSocial: "Cliente 9", correo: null }));
  });
});
