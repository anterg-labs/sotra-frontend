import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { AltaTipo } from "./alta-tipo";
import { BarraFiltrosTipos } from "./barra-filtros-tipos";
import { construirUrlTipos, leerFiltrosTipos } from "./filtros";
import { ListadoTipos } from "./listado-tipos";
import { TablaTipos } from "./tabla-tipos";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
const listarTiposMaquinaServidor = vi.hoisted(() => vi.fn());
const cambiarEstadoTipoMaquinaAccion = vi.hoisted(() => vi.fn());
const crearTipoMaquinaAccion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));
vi.mock("@/servicios/servidor/tipos-maquina", () => ({ listarTiposMaquinaServidor }));
vi.mock("./acciones", () => ({ cambiarEstadoTipoMaquinaAccion, crearTipoMaquinaAccion }));

const tipo = (id: number, estado: "activo" | "inactivo" = "activo") => ({ id, nombre: "Tipo " + id, estado });
const pagina = (elementos: ReturnType<typeof tipo>[], totalPaginas = 1) => ({
  elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas,
});
const filtrosVacios = { buscar: "", estado: "", pagina: 1 };
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando tipos de máquina…">{ui}</ProveedorNavegacionListado>;

beforeEach(() => {
  [push, replace, mostrarAviso, listarTiposMaquinaServidor, cambiarEstadoTipoMaquinaAccion, crearTipoMaquinaAccion].forEach((f) => f.mockReset());
  listarTiposMaquinaServidor.mockResolvedValue(pagina([tipo(1), tipo(2, "inactivo")]));
});

describe("filtros de la URL de tipos", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosTipos({})).toEqual(filtrosVacios);
    expect(leerFiltrosTipos({ buscar: "gr", estado: "inactivo", pagina: "2" })).toEqual({ buscar: "gr", estado: "inactivo", pagina: 2 });
    expect(construirUrlTipos({ buscar: "gr", estado: "", pagina: 3 })).toBe("/activos/tipos?buscar=gr&pagina=3");
  });
});

describe("listado de tipos (Server Component)", () => {
  it("trae la página con los filtros y muestra la tabla con acciones según el estado", async () => {
    render(conNavegacion(await ListadoTipos({ filtros: { buscar: "x", estado: "activo", pagina: 2 } })));
    expect(listarTiposMaquinaServidor).toHaveBeenCalledWith({ buscar: "x", estado: "activo", pagina: 2 });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Tipo 1")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Modificar tipo de máquina" })).toHaveAttribute("href", "/activos/tipos/1/editar");
    expect(within(filas[1]).getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/activos/tipos/1");
    expect(within(filas[2]).getByText("Inactivo")).toBeInTheDocument();
    expect(within(filas[2]).queryByRole("button", { name: "Dar de baja" })).not.toBeInTheDocument();
  });

  it("informa el error y el estado vacío, y pagina conservando los filtros", async () => {
    listarTiposMaquinaServidor.mockRejectedValueOnce(new Error("x"));
    const { unmount } = render(await ListadoTipos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se pudo obtener el listado de tipos de máquina.")).toBeInTheDocument();
    unmount();

    listarTiposMaquinaServidor.mockResolvedValueOnce(pagina([]));
    const { unmount: desmontar } = render(await ListadoTipos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se encontraron tipos de máquina con los filtros aplicados.")).toBeInTheDocument();
    desmontar();

    listarTiposMaquinaServidor.mockResolvedValueOnce(pagina([tipo(1)], 2));
    render(conNavegacion(await ListadoTipos({ filtros: { ...filtrosVacios, buscar: "gr" } })));
    expect(screen.getByText("Página 1 de 2 (1 tipos)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/activos/tipos?buscar=gr&pagina=2");
  });
});

describe("barra de filtros de tipos (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("el texto busca una sola vez tras el retardo", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosTipos filtros={{ ...filtrosVacios, pagina: 3 }} />));
    const buscar = screen.getByLabelText("Buscar tipo");
    fireEvent.change(buscar, { target: { value: "g" } });
    fireEvent.change(buscar, { target: { value: "gr" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/activos/tipos?buscar=gr");
  });

  it("aplica texto y estado en la URL sin botón y los limpia", () => {
    render(conNavegacion(<BarraFiltrosTipos filtros={{ ...filtrosVacios, pagina: 3 }} />));
    fireEvent.change(screen.getByLabelText("Buscar tipo"), { target: { value: "gr" } });
    fireEvent.change(screen.getByLabelText("Estado del tipo"), { target: { value: "inactivo" } });
    expect(screen.queryByRole("button", { name: "Filtrar tipos" })).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/activos/tipos?buscar=gr&estado=inactivo");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(replace).toHaveBeenLastCalledWith("/activos/tipos");
    expect(screen.getByLabelText("Buscar tipo")).toHaveValue("");
  });
});

describe("tabla de tipos (baja)", () => {
  const tipos = [tipo(1), tipo(2, "inactivo")];

  it("pide confirmación, llama a la acción y cierra", async () => {
    cambiarEstadoTipoMaquinaAccion.mockResolvedValue({ exito: true });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaTipos tipos={tipos} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    const dialogo = screen.getByRole("dialog", { name: "Dar de baja tipo de máquina" });
    expect(dialogo).toHaveTextContent("Tipo 1");
    expect(cambiarEstadoTipoMaquinaAccion).not.toHaveBeenCalled();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(cambiarEstadoTipoMaquinaAccion).toHaveBeenCalledWith(1, "inactivo"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancelar no llama a la acción; un fallo muestra el error; resalta el tipo nuevo", async () => {
    cambiarEstadoTipoMaquinaAccion.mockResolvedValue({ exito: false, mensaje: "No se pudo dar de baja el tipo de máquina seleccionado." });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaTipos tipos={tipos} filtros={{ buscar: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(cambiarEstadoTipoMaquinaAccion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("error", "No se pudo dar de baja el tipo de máquina seleccionado."));

    act(() => marcarCreado("tipos-maquina", 2));
    expect(screen.getAllByRole("row")[2]).toHaveClass("fila-nueva");
  });
});

describe("alta de tipo en modal", () => {
  it("abre el formulario y, al guardar, cierra, resalta y avisa", async () => {
    crearTipoMaquinaAccion.mockResolvedValue({ exito: true, registro: tipo(9) });
    render(<AltaTipo />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar tipo" }));
    const dialogo = await screen.findByRole("dialog", { name: "Registrar nuevo tipo de máquina" });
    fireEvent.change(within(dialogo).getByLabelText("Nombre del tipo de máquina"), { target: { value: "Grúa" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar registro" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Tipo de máquina registrado."));
    expect(crearTipoMaquinaAccion).toHaveBeenCalledWith({ nombre: "Grúa", estado: "activo" });
  });
});
