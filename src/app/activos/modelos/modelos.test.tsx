import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { AltaModelo } from "./alta-modelo";
import { BarraFiltrosModelos } from "./barra-filtros-modelos";
import { construirUrlModelos, leerFiltrosModelos } from "./filtros";
import { ListadoModelos } from "./listado-modelos";
import { TablaModelos } from "./tabla-modelos";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
const listarModelosMaquinaServidor = vi.hoisted(() => vi.fn());
const listarTiposMaquinaPaginados = vi.hoisted(() => vi.fn());
const cambiarEstadoModeloMaquinaAccion = vi.hoisted(() => vi.fn());
const crearModeloMaquinaAccion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));
vi.mock("@/servicios/servidor/modelos-maquina", () => ({ listarModelosMaquinaServidor }));
vi.mock("@/servicios/servicio-tipos-maquina", () => ({ listarTiposMaquinaPaginados }));
vi.mock("./acciones", () => ({ cambiarEstadoModeloMaquinaAccion, crearModeloMaquinaAccion }));

const modelo = (id: number, estado: "activo" | "inactivo" = "activo") => ({
  id, nombre: "Modelo " + id, tipoMaquinaId: 3, nombreTipoMaquina: "Excavadora", descripcion: "Desc " + id, estado,
});
const tipo = (id: number, estado: "activo" | "inactivo" = "activo") => ({ id, nombre: "Tipo " + id, estado });
const pagina = (elementos: unknown[], totalPaginas = 1) => ({
  elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas,
});
const filtrosVacios = { buscar: "", tipoMaquinaId: "", estado: "", pagina: 1 };
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando modelos de máquina…">{ui}</ProveedorNavegacionListado>;

beforeEach(() => {
  [push, replace, mostrarAviso, listarModelosMaquinaServidor, listarTiposMaquinaPaginados, cambiarEstadoModeloMaquinaAccion, crearModeloMaquinaAccion]
    .forEach((f) => f.mockReset());
  listarModelosMaquinaServidor.mockResolvedValue(pagina([modelo(1), modelo(2, "inactivo")]));
  listarTiposMaquinaPaginados.mockResolvedValue(pagina([tipo(3)]));
});

describe("filtros de la URL de modelos", () => {
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosModelos({})).toEqual(filtrosVacios);
    expect(leerFiltrosModelos({ buscar: "cat", tipoMaquinaId: "3", estado: "activo", pagina: "2" })).toEqual({
      buscar: "cat", tipoMaquinaId: "3", estado: "activo", pagina: 2,
    });
    expect(leerFiltrosModelos({ tipoMaquinaId: "3 OR 1=1" }).tipoMaquinaId).toBe("");
    expect(construirUrlModelos({ buscar: "", tipoMaquinaId: "3", estado: "", pagina: 2 })).toBe("/activos/modelos?tipoMaquinaId=3&pagina=2");
  });
});

describe("listado de modelos (Server Component)", () => {
  it("muestra la tabla con el nombre del tipo y las acciones según el estado", async () => {
    render(conNavegacion(await ListadoModelos({ filtros: { ...filtrosVacios, tipoMaquinaId: "3" } })));
    expect(listarModelosMaquinaServidor).toHaveBeenCalledWith({ ...filtrosVacios, tipoMaquinaId: "3" });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Modelo 1")).toBeInTheDocument();
    expect(within(filas[1]).getByText("Excavadora")).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Modificar modelo de máquina" })).toHaveAttribute("href", "/activos/modelos/1/editar");
    expect(within(filas[2]).queryByRole("button", { name: "Dar de baja" })).not.toBeInTheDocument();
  });

  it("informa el error y el estado vacío, y pagina conservando el filtro de tipo", async () => {
    listarModelosMaquinaServidor.mockRejectedValueOnce(new Error("x"));
    const { unmount } = render(await ListadoModelos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se pudo obtener el listado de modelos de máquina.")).toBeInTheDocument();
    unmount();

    listarModelosMaquinaServidor.mockResolvedValueOnce(pagina([]));
    const { unmount: desmontar } = render(await ListadoModelos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se encontraron modelos de máquina con los filtros aplicados.")).toBeInTheDocument();
    desmontar();

    listarModelosMaquinaServidor.mockResolvedValueOnce(pagina([modelo(1)], 2));
    render(conNavegacion(await ListadoModelos({ filtros: { ...filtrosVacios, tipoMaquinaId: "3" } })));
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/activos/modelos?tipoMaquinaId=3&pagina=2");
  });
});

describe("barra de filtros de modelos (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("el texto busca una sola vez tras el retardo", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosModelos filtros={filtrosVacios} tiposMaquina={[]} />));
    const buscar = screen.getByLabelText("Buscar modelo");
    fireEvent.change(buscar, { target: { value: "c" } });
    fireEvent.change(buscar, { target: { value: "cat" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/activos/modelos?buscar=cat");
  });

  it("aplica texto, tipo (combobox) y estado en la URL sin botón y los limpia", async () => {
    render(conNavegacion(<BarraFiltrosModelos filtros={filtrosVacios} tiposMaquina={[tipo(3)]} />));
    fireEvent.change(screen.getByLabelText("Buscar modelo"), { target: { value: "cat" } });
    fireEvent.focus(screen.getByRole("combobox", { name: "Tipo" }));
    fireEvent.click(await screen.findByRole("option", { name: "Tipo 3" }));
    fireEvent.change(screen.getByLabelText("Estado del modelo"), { target: { value: "activo" } });
    expect(screen.queryByRole("button", { name: "Filtrar modelos" })).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith("/activos/modelos?buscar=cat&tipoMaquinaId=3&estado=activo");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(replace).toHaveBeenLastCalledWith("/activos/modelos");
  });

  it("muestra el tipo elegido en la URL aunque no esté en la primera página", () => {
    render(conNavegacion(<BarraFiltrosModelos filtros={{ ...filtrosVacios, tipoMaquinaId: "3" }} tiposMaquina={[tipo(3)]} />));
    expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveValue("Tipo 3");
  });
});

describe("tabla de modelos (baja)", () => {
  const modelos = [modelo(1), modelo(2, "inactivo")];

  it("pide confirmación y llama a la acción; cancelar no la llama", async () => {
    cambiarEstadoModeloMaquinaAccion.mockResolvedValue({ exito: true });
    render(<TablaModelos modelos={modelos} />);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(cambiarEstadoModeloMaquinaAccion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    const dialogo = screen.getByRole("dialog", { name: "Dar de baja modelo de máquina" });
    expect(dialogo).toHaveTextContent("Modelo 1");
    fireEvent.click(within(dialogo).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(cambiarEstadoModeloMaquinaAccion).toHaveBeenCalledWith(1, "inactivo"));
  });

  it("muestra el error si falla y resalta el modelo recién creado", async () => {
    cambiarEstadoModeloMaquinaAccion.mockResolvedValue({ exito: false, mensaje: "No se pudo dar de baja el modelo de máquina seleccionado." });
    render(<TablaModelos modelos={modelos} />);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Dar de baja" }));
    expect(await screen.findByText("No se pudo dar de baja el modelo de máquina seleccionado.")).toBeInTheDocument();
    act(() => marcarCreado("modelos-maquina", 2));
    expect(screen.getAllByRole("row")[2]).toHaveClass("fila-nueva");
  });
});

describe("alta de modelo en modal", () => {
  it("abre el formulario y, al guardar, cierra y avisa", async () => {
    crearModeloMaquinaAccion.mockResolvedValue({ exito: true, registro: modelo(9) });
    render(<AltaModelo tiposMaquina={[tipo(3)]} />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar modelo" }));
    const dialogo = await screen.findByRole("dialog", { name: "Registrar nuevo modelo de máquina" });
    fireEvent.change(within(dialogo).getByLabelText("Nombre del modelo"), { target: { value: "Nuevo" } });
    fireEvent.focus(within(dialogo).getByRole("combobox", { name: /Tipo de máquina/ }));
    fireEvent.click(await screen.findByRole("option", { name: "Tipo 3" }));
    fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar registro" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Modelo de máquina registrado."));
    expect(crearModeloMaquinaAccion).toHaveBeenCalledWith({ nombre: "Nuevo", tipoMaquinaId: 3, descripcion: null, estado: "activo" });
  });

  it("informa si no se pudieron cargar los tipos", () => {
    render(<AltaModelo tiposMaquina={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar modelo" }));
    expect(screen.getByText("No se pudo obtener el listado de tipos de máquina.")).toBeInTheDocument();
  });
});
