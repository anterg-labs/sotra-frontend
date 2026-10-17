import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { AlertaStock } from "./alerta-stock";
import { AltaRepuesto } from "./alta-repuesto";
import { BarraFiltrosRepuestos } from "./barra-filtros-repuestos";
import { aFiltrosApiRepuestos, construirUrlRepuestos, leerFiltrosRepuestos } from "./filtros";
import { ListadoRepuestos } from "./listado-repuestos";
import { TablaRepuestos } from "./tabla-repuestos";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
const avisarStockActualizado = vi.hoisted(() => vi.fn());
const listarRepuestosServidor = vi.hoisted(() => vi.fn());
const cambiarEstadoRepuestoAccion = vi.hoisted(() => vi.fn());
const crearRepuestoAccion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));
vi.mock("@/hooks/use-alertas-stock", () => ({ avisarStockActualizado }));
vi.mock("@/servicios/servidor/repuestos", () => ({ listarRepuestosServidor }));
vi.mock("./acciones", () => ({ cambiarEstadoRepuestoAccion, crearRepuestoAccion }));

function repuesto(id: number, estadoStock: "normal" | "bajo" | "sin_stock" = "normal", estado: "activo" | "inactivo" = "activo") {
  return {
    id, codigo: "R-" + id, nombre: "Filtro " + id, descripcion: "", marca: "CAT", ubicacion: "Depósito " + id,
    cantidad: estadoStock === "sin_stock" ? 0 : 10, cantidadMinima: 5, estado, estadoStock,
  };
}
const pagina = (elementos: unknown[], totalPaginas = 1) => ({
  elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas,
});
const filtrosVacios = { buscar: "", estado: "", ubicacion: "", stock: "" as const, pagina: 1 };
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando repuestos…">{ui}</ProveedorNavegacionListado>;

beforeEach(() => {
  [push, replace, mostrarAviso, avisarStockActualizado, listarRepuestosServidor, cambiarEstadoRepuestoAccion, crearRepuestoAccion].forEach((f) => f.mockReset());
  listarRepuestosServidor.mockResolvedValue(pagina([repuesto(1), repuesto(2, "bajo"), repuesto(3, "sin_stock"), repuesto(4, "normal", "inactivo")]));
});

describe("filtros de la URL de repuestos", () => {
  it("lee los filtros, ignora valores inválidos de stock y arma la URL", () => {
    expect(leerFiltrosRepuestos({})).toEqual(filtrosVacios);
    expect(leerFiltrosRepuestos({ buscar: "f", estado: "activo", ubicacion: "A", stock: "bajo", pagina: "2" })).toEqual({
      buscar: "f", estado: "activo", ubicacion: "A", stock: "bajo", pagina: 2,
    });
    expect(leerFiltrosRepuestos({ stock: "otro" }).stock).toBe("");
    expect(construirUrlRepuestos({ ...filtrosVacios, stock: "alerta", pagina: 3 })).toBe("/repuestos?stock=alerta&pagina=3");
  });

  it("traduce el filtro de stock a los parámetros de la API", () => {
    expect(aFiltrosApiRepuestos({ ...filtrosVacios, stock: "alerta" })).toMatchObject({ bajoStock: true, estadoStock: "", orden: "criticidad" });
    expect(aFiltrosApiRepuestos({ ...filtrosVacios, stock: "sin_stock" })).toMatchObject({ bajoStock: false, estadoStock: "sin_stock" });
    expect(aFiltrosApiRepuestos(filtrosVacios)).toMatchObject({ bajoStock: false, estadoStock: "" });
  });
});

describe("listado de repuestos (Server Component)", () => {
  it("muestra la tabla con barra de nivel solo en activos y marca las filas con stock bajo y sin stock", async () => {
    render(conNavegacion(await ListadoRepuestos({ filtros: { ...filtrosVacios, stock: "bajo" } })));
    expect(listarRepuestosServidor).toHaveBeenCalledWith(expect.objectContaining({ estadoStock: "bajo", orden: "criticidad", pagina: 1 }));
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Stock normal")).toBeInTheDocument();
    expect(filas[2]).toHaveClass("fila-stock-bajo");
    expect(filas[3]).toHaveClass("fila-stock-sin-stock");
    expect(within(filas[4]).queryByText(/Stock/)).not.toBeInTheDocument();
    expect(within(filas[4]).getByRole("button", { name: "Reactivar repuesto" })).toBeInTheDocument();
    expect(within(filas[1]).getByRole("link", { name: "Modificar repuesto" })).toHaveAttribute("href", "/repuestos/1/editar");
  });

  it("muestra el error, el vacío (con texto distinto si hay filtro de stock) y pagina conservando filtros", async () => {
    listarRepuestosServidor.mockRejectedValueOnce(new Error("x"));
    const { unmount } = render(await ListadoRepuestos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se pudo obtener el listado de repuestos.")).toBeInTheDocument();
    unmount();

    listarRepuestosServidor.mockResolvedValueOnce(pagina([]));
    const { unmount: segundo } = render(await ListadoRepuestos({ filtros: filtrosVacios }));
    expect(screen.getByText("No se encontraron repuestos con los filtros aplicados.")).toBeInTheDocument();
    segundo();

    listarRepuestosServidor.mockResolvedValueOnce(pagina([]));
    const { unmount: tercero } = render(await ListadoRepuestos({ filtros: { ...filtrosVacios, stock: "bajo" } }));
    expect(screen.getByText("No hay repuestos con stock bajo o sin stock con los filtros aplicados.")).toBeInTheDocument();
    tercero();

    listarRepuestosServidor.mockResolvedValueOnce(pagina([repuesto(1)], 3));
    render(conNavegacion(await ListadoRepuestos({ filtros: { ...filtrosVacios, ubicacion: "A", stock: "alerta" } })));
    expect(screen.getByText("Página 1 de 3 (1 repuestos)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/repuestos?ubicacion=A&stock=alerta&pagina=2");
  });
});

describe("aviso de alerta de stock", () => {
  const alertas = { bajo: 6, sinStock: 1, total: 7 };

  it("resume sin stock y stock bajo, lista hasta cinco y ofrece ver todos", () => {
    const repuestos = [1, 2, 3, 4, 5, 6].map((id) => repuesto(id, "bajo"));
    render(conNavegacion(<AlertaStock alertas={alertas} repuestos={repuestos} />));
    const aviso = screen.getByRole("status", { name: "Alerta de stock insuficiente" });
    expect(aviso).toHaveClass("aviso-stock-critico");
    expect(within(aviso).getByText("Stock insuficiente (7)")).toBeInTheDocument();
    expect(within(aviso).getByText(/1 sin stock y 6 con stock bajo/)).toBeInTheDocument();
    expect(within(aviso).getAllByRole("listitem")).toHaveLength(5);
    expect(within(aviso).getAllByRole("link", { name: "Ingresar stock" })[0]).toHaveAttribute("href", "/repuestos/1?ingresar=1");
    fireEvent.click(within(aviso).getByRole("button", { name: "Ver los 7 repuestos con alerta" }));
    expect(push).toHaveBeenLastCalledWith("/repuestos?stock=alerta");
  });

  it("no se muestra cuando no hay alertas", () => {
    render(conNavegacion(<AlertaStock alertas={{ bajo: 0, sinStock: 0, total: 0 }} repuestos={[]} />));
    expect(screen.queryByRole("status", { name: "Alerta de stock insuficiente" })).not.toBeInTheDocument();
  });
});

describe("barra de filtros de repuestos (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("el texto busca una sola vez tras el retardo y no hay botón «Aplicar filtros»", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosRepuestos alertas={null} filtros={{ ...filtrosVacios, pagina: 3 }} />));
    expect(screen.queryByRole("button", { name: "Aplicar filtros" })).not.toBeInTheDocument();
    const buscar = screen.getByLabelText("Buscar");
    fireEvent.change(buscar, { target: { value: "f" } });
    fireEvent.change(buscar, { target: { value: "filtro" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/repuestos?buscar=filtro");
  });

  it("si la URL cambia desde fuera (por ejemplo «Ver los repuestos con alerta») los chips se resincronizan", () => {
    const { rerender } = render(conNavegacion(<BarraFiltrosRepuestos alertas={null} filtros={filtrosVacios} />));
    expect(screen.getByRole("button", { name: /Todos/ })).toHaveAttribute("aria-pressed", "true");
    rerender(conNavegacion(<BarraFiltrosRepuestos alertas={null} filtros={{ ...filtrosVacios, stock: "alerta" }} />));
    expect(screen.getByRole("button", { name: /Con alerta/ })).toHaveAttribute("aria-pressed", "true");
    expect(replace).not.toHaveBeenCalled();
  });

  it("muestra los chips con contadores y marca el activo; elegirlos escribe la URL", () => {
    render(conNavegacion(<BarraFiltrosRepuestos alertas={{ bajo: 2, sinStock: 1, total: 3 }} filtros={{ ...filtrosVacios, stock: "sin_stock", buscar: "f" }} />));
    expect(screen.getByRole("button", { name: /Sin stock/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Con alerta/ })).toHaveTextContent("3");
    fireEvent.click(screen.getByRole("button", { name: /Stock bajo/ }));
    expect(replace).toHaveBeenLastCalledWith("/repuestos?buscar=f&stock=bajo");
  });

  it("aplica texto, ubicación y estado conservando el chip, y limpia todo", () => {
    render(conNavegacion(<BarraFiltrosRepuestos alertas={null} filtros={{ ...filtrosVacios, stock: "bajo", pagina: 4 }} />));
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "filtro" } });
    fireEvent.change(screen.getByLabelText("Ubicación"), { target: { value: "A1" } });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activo" } });
    expect(replace).toHaveBeenLastCalledWith("/repuestos?buscar=filtro&estado=activo&ubicacion=A1&stock=bajo");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/repuestos");
    expect(screen.getByLabelText("Buscar")).toHaveValue("");
  });
});

describe("tabla de repuestos (baja y reactivación)", () => {
  const repuestos = [repuesto(1), repuesto(2, "normal", "inactivo")];

  it("confirma la baja nombrando el repuesto y avisa a los contadores de stock", async () => {
    cambiarEstadoRepuestoAccion.mockResolvedValue({ exito: true });
    render(<TablaRepuestos repuestos={repuestos} />);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    const dialogo = screen.getByRole("dialog", { name: "Dar de baja repuesto" });
    expect(dialogo).toHaveTextContent("Filtro 1");
    expect(cambiarEstadoRepuestoAccion).not.toHaveBeenCalled();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(cambiarEstadoRepuestoAccion).toHaveBeenCalledWith(1, "inactivo"));
    await waitFor(() => expect(avisarStockActualizado).toHaveBeenCalled());
  });

  it("la reactivación exitosa avisa al usuario; si falla muestra el error", async () => {
    cambiarEstadoRepuestoAccion
      .mockResolvedValueOnce({ exito: true })
      .mockResolvedValueOnce({ exito: false, mensaje: "No se pudo reactivar el repuesto seleccionado." });
    render(<TablaRepuestos repuestos={repuestos} />);
    fireEvent.click(screen.getByRole("button", { name: "Reactivar repuesto" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Repuesto reactivado."));
    fireEvent.click(screen.getByRole("button", { name: "Reactivar repuesto" }));
    expect(await screen.findByText("No se pudo reactivar el repuesto seleccionado.")).toBeInTheDocument();
  });

  it("cancelar la baja no llama a la acción; resalta el repuesto nuevo", () => {
    render(<TablaRepuestos repuestos={repuestos} />);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(cambiarEstadoRepuestoAccion).not.toHaveBeenCalled();
    act(() => marcarCreado("repuestos", 2));
    expect(screen.getAllByRole("row")[2]).toHaveClass("fila-nueva");
  });
});

describe("alta de repuesto en modal", () => {
  it("abre el formulario, valida y, al guardar, cierra y avisa", async () => {
    crearRepuestoAccion.mockResolvedValue({ exito: true, registro: repuesto(9) });
    render(<AltaRepuesto />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar repuesto" }));
    const dialogo = await screen.findByRole("dialog", { name: "Registrar repuesto" });
    fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar registro" }));
    expect(await within(dialogo).findByText("El código del repuesto es obligatorio.")).toBeInTheDocument();
    expect(crearRepuestoAccion).not.toHaveBeenCalled();

    fireEvent.change(within(dialogo).getByLabelText("Código"), { target: { value: "R-9" } });
    fireEvent.change(within(dialogo).getByLabelText("Nombre del repuesto"), { target: { value: "Filtro" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar registro" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Repuesto registrado."));
    expect(crearRepuestoAccion).toHaveBeenCalledWith(expect.objectContaining({ codigo: "R-9", cantidad: 0, cantidadMinima: 0 }));
  });
});
