import { resolverServidor } from "@/pruebas/resolver-servidor";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioTipoMaquina } from "@/componentes/formulario-tipo-maquina";
import EditarTipo from "./[id]/editar/page";
import DetalleTipo from "./[id]/page";
import PaginaTipos from "./page";
import NuevoTipo from "./nuevo/page";

const push = vi.hoisted(() => vi.fn());
const listado = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  obtenerTipoMaquinaServidor: vi.fn(),
  listarModelosMaquinaServidor: vi.fn(),
  actualizarTipoMaquinaAccion: vi.fn(),
  crearTipoMaquinaAccion: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/servicios/servidor/tipos-maquina", () => ({ obtenerTipoMaquinaServidor: s.obtenerTipoMaquinaServidor }));
vi.mock("@/servicios/servidor/modelos-maquina", () => ({ listarModelosMaquinaServidor: s.listarModelosMaquinaServidor }));
vi.mock("./acciones", () => ({
  actualizarTipoMaquinaAccion: s.actualizarTipoMaquinaAccion,
  crearTipoMaquinaAccion: s.crearTipoMaquinaAccion,
  cambiarEstadoTipoMaquinaAccion: vi.fn(),
}));
vi.mock("./listado-tipos", () => ({
  ListadoTipos: (props: unknown) => {
    listado(props);
    return <p>Listado simulado</p>;
  },
}));

const tipo = { id: 5, nombre: "Excavadora", estado: "activo" };
const modelo = { id: 7, nombre: "CAT 320", tipoMaquinaId: 5, descripcion: null, estado: "activo" };
const pagina = (elementos: unknown[]) => ({ elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 });
const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  push.mockReset();
  listado.mockReset();
});

describe("página del listado de tipos (Server Component)", () => {
  it("lee searchParams y arma encabezado, alta, filtros y listado", async () => {
    render(await PaginaTipos({ searchParams: Promise.resolve({ buscar: "ex", estado: "activo", pagina: "2" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Tipos de máquina" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar tipo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar tipo")).toHaveValue("ex");
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
    expect(listado).toHaveBeenCalledWith({ filtros: { buscar: "ex", estado: "activo", pagina: 2 } });
  });
});

describe("detalle de tipo (Server Component)", () => {
  it("lista los modelos del tipo", async () => {
    s.obtenerTipoMaquinaServidor.mockResolvedValue(tipo);
    s.listarModelosMaquinaServidor.mockResolvedValue(pagina([modelo]));
    render(await DetalleTipo(parametros("5")));
    expect(s.listarModelosMaquinaServidor).toHaveBeenCalledWith({ buscar: "", tipoMaquinaId: "5", estado: "", pagina: 1 });
    expect(screen.getByRole("heading", { level: 1, name: "Excavadora" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CAT 320" })).toHaveAttribute("href", "/activos/modelos/7");
    expect(screen.getByRole("heading", { name: "Modelos de este tipo (1)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Modificar" })).toHaveAttribute("href", "/activos/tipos/5/editar");
  });

  it("muestra el vacío, el error de carga y rechaza un id inválido", async () => {
    s.obtenerTipoMaquinaServidor.mockResolvedValue(tipo);
    s.listarModelosMaquinaServidor.mockResolvedValue(pagina([]));
    const { unmount } = render(await DetalleTipo(parametros("5")));
    expect(screen.getByText("No hay modelos registrados de este tipo.")).toBeInTheDocument();
    unmount();

    s.obtenerTipoMaquinaServidor.mockRejectedValue(new Error("x"));
    const { unmount: desmontar } = render(await DetalleTipo(parametros("5")));
    expect(screen.getByText("No se pudo obtener la información del tipo de máquina solicitado.")).toBeInTheDocument();
    desmontar();

    s.obtenerTipoMaquinaServidor.mockClear();
    render(await DetalleTipo(parametros("abc")));
    expect(screen.getByText("No se pudo obtener la información del tipo de máquina solicitado.")).toBeInTheDocument();
    expect(s.obtenerTipoMaquinaServidor).not.toHaveBeenCalled();
  });
});

describe("edición y alta de tipo", () => {
  it("la edición guarda nombre y estado con la acción ligada al id", async () => {
    s.obtenerTipoMaquinaServidor.mockResolvedValue(tipo);
    s.actualizarTipoMaquinaAccion.mockResolvedValue({ exito: true, registro: tipo });
    render(await resolverServidor(await EditarTipo(parametros("5"))));
    fireEvent.change(screen.getByLabelText("Nombre del tipo de máquina"), { target: { value: "Excavadora XL" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() => expect(s.actualizarTipoMaquinaAccion).toHaveBeenCalledWith(5, { nombre: "Excavadora XL", estado: "activo" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/activos/tipos"));
  });

  it("el interruptor permite dar de baja al guardar", async () => {
    s.obtenerTipoMaquinaServidor.mockResolvedValue(tipo);
    s.actualizarTipoMaquinaAccion.mockResolvedValue({ exito: true, registro: tipo });
    render(await resolverServidor(await EditarTipo(parametros("5"))));
    fireEvent.click(screen.getByRole("switch", { name: "Activo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() => expect(s.actualizarTipoMaquinaAccion).toHaveBeenCalledWith(5, { nombre: "Excavadora", estado: "inactivo" }));
  });

  it("la edición informa el error de carga sin mostrar el interruptor", async () => {
    s.obtenerTipoMaquinaServidor.mockRejectedValue(new Error("x"));
    render(await resolverServidor(await EditarTipo(parametros("5"))));
    expect(screen.getByText("No se pudo obtener la información del tipo de máquina solicitado.")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("la alta crea el tipo y vuelve al listado", async () => {
    s.crearTipoMaquinaAccion.mockResolvedValue({ exito: true, registro: tipo });
    render(<NuevoTipo />);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nombre del tipo de máquina"), { target: { value: "Grúa" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar registro" }));
    await waitFor(() => expect(s.crearTipoMaquinaAccion).toHaveBeenCalledWith({ nombre: "Grúa", estado: "activo" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/activos/tipos"));
  });
});

describe("formulario de tipos", () => {
  it("enfoca el nombre y muestra el error cuando está vacío, sin llamar a la acción", async () => {
    const accion = vi.fn();
    render(<FormularioTipoMaquina accion={accion} etiquetaConfirmacion="Guardar" />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    const entrada = screen.getByLabelText("Nombre del tipo de máquina");
    expect(await screen.findByText("El campo Nombre es obligatorio.")).toBeInTheDocument();
    await waitFor(() => expect(entrada).toHaveFocus());
    expect(entrada).toHaveAttribute("aria-invalid", "true");
    expect(accion).not.toHaveBeenCalled();
  });

  it("ubica un nombre duplicado junto al campo y muestra un error general enfocable", async () => {
    const accion = vi
      .fn()
      .mockResolvedValueOnce({ exito: false, errores: { nombre: "Ya existe un tipo de máquina con ese nombre." }, mensaje: "" })
      .mockResolvedValueOnce({ exito: false, errores: {}, mensaje: "Falla del servidor" });
    render(<FormularioTipoMaquina accion={accion} etiquetaConfirmacion="Guardar" tipoMaquinaInicial={{ id: 1, nombre: "Grúa", estado: "activo" }} />);
    expect(screen.getByLabelText("Nombre del tipo de máquina")).toHaveValue("Grúa");
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByText("Ya existe un tipo de máquina con ese nombre.")).toHaveAttribute("id", "nombre-error"));
    expect(screen.getByLabelText("Nombre del tipo de máquina")).toHaveAttribute("aria-invalid", "true");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    const alerta = await screen.findByText("Falla del servidor");
    await waitFor(() => expect(alerta).toHaveFocus());
  });

  it("con alGuardar avisa y permite cancelar", async () => {
    const alGuardar = vi.fn();
    const alCancelar = vi.fn();
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: tipo });
    render(<FormularioTipoMaquina accion={accion} alCancelar={alCancelar} alGuardar={alGuardar} etiquetaConfirmacion="Guardar" />);
    fireEvent.change(screen.getByLabelText("Nombre del tipo de máquina"), { target: { value: "Grúa" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(alGuardar).toHaveBeenCalledWith(tipo));
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(alCancelar).toHaveBeenCalled();
  });
});
