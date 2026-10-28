import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AltaActivo } from "@/componentes/alta-activo";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { AltaActivoModal } from "./alta-activo-modal";
import { BarraFiltrosActivos } from "./barra-filtros-activos";
import { construirUrlActivos, leerFiltrosActivos } from "./filtros";
import { ListadoActivos } from "./listado-activos";
import { TablaActivos } from "./tabla-activos";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
const listarActivosServidor = vi.hoisted(() => vi.fn());
const listarClientesPaginados = vi.hoisted(() => vi.fn());
const listarModelosMaquinaPaginados = vi.hoisted(() => vi.fn());
const cambiarEstadoActivoAccion = vi.hoisted(() => vi.fn());
const crearActivoAccion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));
vi.mock("@/servicios/servidor/activos", () => ({ listarActivosServidor }));
vi.mock("@/servicios/servicio-clientes", () => ({ listarClientesPaginados }));
vi.mock("@/servicios/servicio-modelos-maquina", () => ({ listarModelosMaquinaPaginados }));
vi.mock("./acciones", () => ({ cambiarEstadoActivoAccion, crearActivoAccion }));

function activo(id: number, estado: "activo" | "inactivo" = "activo", nombre: string | null = "Retro " + id) {
  return {
    id, clienteId: 1, nombreCliente: "ACME", numSerie: "SN-" + id, descripcion: null, modeloMaquinaId: 2,
    nombreModeloMaquina: "CAT 320", anioFabricacion: 2020, nombre, ubicacion: null, estado,
  };
}
const cliente = { id: 1, razonSocial: "ACME", estado: "activo" };
const modelo = { id: 2, nombre: "CAT 320", estado: "activo" };
const pagina = (elementos: unknown[], totalPaginas = 1) => ({
  elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas,
});
const filtrosVacios = { buscar: "", clienteId: "", modeloMaquinaId: "", estado: "", pagina: 1 };
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando activos…">{ui}</ProveedorNavegacionListado>;

beforeEach(() => {
  [push, replace, mostrarAviso, listarActivosServidor, listarClientesPaginados, listarModelosMaquinaPaginados, cambiarEstadoActivoAccion, crearActivoAccion]
    .forEach((f) => f.mockReset());
  listarActivosServidor.mockResolvedValue(pagina([activo(1), activo(2, "inactivo", null)]));
  listarClientesPaginados.mockResolvedValue(pagina([cliente]));
  listarModelosMaquinaPaginados.mockResolvedValue(pagina([modelo]));
});

describe("filtros de la URL de activos", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosActivos({})).toEqual(filtrosVacios);
    expect(leerFiltrosActivos({ buscar: "sn", clienteId: "1", modeloMaquinaId: "2", estado: "activo", pagina: "3" })).toEqual({
      buscar: "sn", clienteId: "1", modeloMaquinaId: "2", estado: "activo", pagina: 3,
    });
    expect(leerFiltrosActivos({ clienteId: "a", modeloMaquinaId: "-1", estado: "x", pagina: "x" })).toEqual(filtrosVacios);
    expect(construirUrlActivos({ buscar: "", clienteId: "1", modeloMaquinaId: "", estado: "", pagina: 2 })).toBe("/activos?clienteId=1&pagina=2");
  });
});

describe("listado de activos (Server Component)", () => {
  it("muestra la tabla con cliente y modelo; sin nombre usa un texto de respaldo", async () => {
    render(conNavegacion(await ListadoActivos({ filtros: { ...filtrosVacios, clienteId: "1" } })));
    expect(listarActivosServidor).toHaveBeenCalledWith({ ...filtrosVacios, clienteId: "1" });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Retro 1")).toBeInTheDocument();
    expect(within(filas[1]).getByText("SN-1")).toBeInTheDocument();
    expect(within(filas[1]).getByText("ACME")).toBeInTheDocument();
    expect(within(filas[1]).getByText("CAT 320")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Modificar activo" })).toHaveAttribute("href", "/activos/1/editar");
    expect(within(filas[2]).getByText("Sin nombre")).toBeInTheDocument();
    expect(within(filas[2]).queryByRole("button", { name: "Dar de baja" })).not.toBeInTheDocument();
  });

  it("informa el error y el estado vacío, y pagina conservando los filtros", async () => {
    listarActivosServidor.mockRejectedValueOnce(new Error("x"));
    const { unmount } = render(await ListadoActivos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se pudo obtener el listado de activos.")).toBeInTheDocument();
    unmount();

    listarActivosServidor.mockResolvedValueOnce(pagina([]));
    const { unmount: desmontar } = render(await ListadoActivos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se encontraron activos con los filtros aplicados.")).toBeInTheDocument();
    desmontar();

    listarActivosServidor.mockResolvedValueOnce(pagina([activo(1)], 2));
    render(conNavegacion(await ListadoActivos({ filtros: { ...filtrosVacios, modeloMaquinaId: "2", estado: "activo" } })));
    expect(screen.getByText("Página 1 de 2 (1 activos)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/activos?modeloMaquinaId=2&estado=activo&pagina=2");
  });
});

describe("barra de filtros de activos (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("aplica texto, cliente, modelo y estado en la URL sin botón y los limpia", async () => {
    render(conNavegacion(<BarraFiltrosActivos clientes={[cliente as never]} filtros={filtrosVacios} modelosMaquina={[modelo as never]} />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "SN-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtros avanzados" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Cliente" }));
    fireEvent.click(await screen.findByRole("option", { name: "ACME" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Modelo" }));
    fireEvent.click(await screen.findByRole("option", { name: "CAT 320" }));
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activo" } });
    expect(screen.queryByRole("button", { name: "Aplicar filtros" })).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/activos?buscar=SN-1&clienteId=1&modeloMaquinaId=2&estado=activo");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/activos");
    expect(push).not.toHaveBeenCalled();
  });

  it("el texto busca una sola vez tras el retardo y vuelve a la página 1", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosActivos clientes={[]} filtros={{ ...filtrosVacios, pagina: 5 }} modelosMaquina={[]} />));
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "S" } });
    fireEvent.change(buscar, { target: { value: "SN-9" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/activos?buscar=SN-9");
  });
});

describe("tabla de activos (baja)", () => {
  const activos = [activo(1), activo(2, "inactivo", null)];

  it("ofrece tarjetas de activos con cliente, modelo y detalle sin retirar la tabla", () => {
    const { container } = render(conNavegacion(<TablaActivos activos={activos} filtros={{ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "", pagina: 1 }} />));
    const tarjetas = container.querySelector(".listado-tarjetas-tecnico");
    expect(tarjetas).toBeInTheDocument();
    expect(container.querySelector(".tabla-listado-tecnico")).toContainElement(screen.getByRole("table"));
    const enlace = within(tarjetas as HTMLElement).getByRole("link", { name: /Retro 1/ });
    expect(enlace).toHaveAttribute("href", "/activos/1");
    expect(enlace).toHaveTextContent("SN-1");
    expect(enlace).toHaveTextContent("ACME");
    expect(enlace).toHaveTextContent("CAT 320");
  });

  it("da de baja con confirmación nombrando el activo", async () => {
    cambiarEstadoActivoAccion.mockResolvedValue({ exito: true });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaActivos activos={activos} filtros={{ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    const dialogo = screen.getByRole("dialog", { name: "Dar de baja activo" });
    expect(dialogo).toHaveTextContent("Retro 1");
    expect(cambiarEstadoActivoAccion).not.toHaveBeenCalled();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(cambiarEstadoActivoAccion).toHaveBeenCalledWith(1, "inactivo"));
  });

  it("cancelar no llama a la acción, un fallo muestra el error y se resalta el activo nuevo", async () => {
    cambiarEstadoActivoAccion.mockResolvedValue({ exito: false, mensaje: "No se pudo dar de baja al activo seleccionado." });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaActivos activos={activos} filtros={{ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(cambiarEstadoActivoAccion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("error", "No se pudo dar de baja al activo seleccionado."));
    act(() => marcarCreado("activos", 2));
    expect(screen.getAllByRole("row")[2]).toHaveClass("fila-nueva");
  });
});

describe("alta de activo", () => {
  it("avisa qué falta cuando no hay cliente o modelo activo y si no se pudieron cargar los datos", () => {
    const { unmount } = render(<AltaActivo clientes={[{ ...cliente, estado: "inactivo" } as never]} modelosMaquina={[modelo as never]} />);
    expect(screen.getByText("Primero se debe registrar un cliente activo.")).toBeInTheDocument();
    unmount();
    const { unmount: segundo } = render(<AltaActivo clientes={[cliente as never]} modelosMaquina={[]} />);
    expect(screen.getByText("Primero se debe registrar un modelo de máquina activo.")).toBeInTheDocument();
    segundo();
    render(<AltaActivo clientes={null} modelosMaquina={[modelo as never]} />);
    expect(screen.getByText("No se pudieron obtener los datos necesarios para registrar el activo.")).toBeInTheDocument();
  });

  it("el modal abre el formulario y, al guardar, cierra, resalta y avisa", async () => {
    crearActivoAccion.mockResolvedValue({ exito: true, registro: activo(9) });
    render(<AltaActivoModal clientes={[cliente as never]} modelosMaquina={[modelo as never]} />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar nuevo activo" }));
    const dialogo = await screen.findByRole("dialog", { name: "Registrar nuevo activo" });
    fireEvent.change(within(dialogo).getByLabelText("Número de serie"), { target: { value: "SN-9" } });
    fireEvent.focus(within(dialogo).getByRole("combobox", { name: "Cliente asociado" }));
    fireEvent.click(await screen.findByRole("option", { name: "ACME" }));
    fireEvent.focus(within(dialogo).getByRole("combobox", { name: "Modelo de máquina" }));
    fireEvent.click(await screen.findByRole("option", { name: "CAT 320" }));
    fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar registro" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Activo registrado."));
    expect(crearActivoAccion).toHaveBeenCalledWith({
      clienteId: 1, numSerie: "SN-9", descripcion: null, modeloMaquinaId: 2, anioFabricacion: null, nombre: null, ubicacion: null, estado: "activo",
    });
  });
});
