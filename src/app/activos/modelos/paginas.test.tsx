import { resolverServidor } from "@/pruebas/resolver-servidor";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioModeloMaquina } from "@/componentes/formulario-modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";
import EditarModelo from "./[id]/editar/page";
import DetalleModelo from "./[id]/page";
import PaginaModelos from "./page";
import NuevoModelo from "./nuevo/page";

const push = vi.hoisted(() => vi.fn());
const listado = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  listarModelosMaquinaServidor: vi.fn(),
  obtenerModeloMaquinaServidor: vi.fn(),
  obtenerTipoMaquinaServidor: vi.fn(),
  listarTiposMaquinaServidor: vi.fn(),
  listarActivosServidor: vi.fn(),
  actualizarModeloMaquinaAccion: vi.fn(),
  crearModeloMaquinaAccion: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/servicios/servicio-tipos-maquina", () => ({ listarTiposMaquinaPaginados: vi.fn() }));
vi.mock("@/servicios/servidor/modelos-maquina", () => ({ obtenerModeloMaquinaServidor: s.obtenerModeloMaquinaServidor, listarModelosMaquinaServidor: s.listarModelosMaquinaServidor }));
vi.mock("@/servicios/servidor/tipos-maquina", () => ({
  obtenerTipoMaquinaServidor: s.obtenerTipoMaquinaServidor,
  listarTiposMaquinaServidor: s.listarTiposMaquinaServidor,
}));
vi.mock("@/servicios/servidor/activos", () => ({ listarActivosServidor: s.listarActivosServidor }));
vi.mock("./acciones", () => ({
  actualizarModeloMaquinaAccion: s.actualizarModeloMaquinaAccion,
  crearModeloMaquinaAccion: s.crearModeloMaquinaAccion,
  cambiarEstadoModeloMaquinaAccion: vi.fn(),
}));
vi.mock("./listado-modelos", () => ({
  ListadoModelos: (props: unknown) => {
    listado(props);
    return <p>Listado simulado</p>;
  },
}));

const tipo = { id: 3, nombre: "Excavadora", estado: "activo" };
const tipoInactivo = { id: 4, nombre: "Vieja", estado: "inactivo" };
const modelo = { id: 5, nombre: "CAT 320", tipoMaquinaId: 3, descripcion: null, estado: "activo" };
const activo = { id: 5, numSerie: "SN-5", nombre: "Retro" };
const pagina = (elementos: unknown[]) => ({ elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 });
const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  push.mockReset();
  listado.mockReset();
  s.listarModelosMaquinaServidor.mockResolvedValue(pagina([]));
  s.listarTiposMaquinaServidor.mockResolvedValue(pagina([tipo]));
  s.listarActivosServidor.mockResolvedValue(pagina([]));
});

describe("página del listado de modelos (Server Component)", () => {
  it("lee searchParams, busca el tipo elegido si no está en la primera página y arma el listado", async () => {
    s.obtenerTipoMaquinaServidor.mockResolvedValue(tipoInactivo);
    render(await PaginaModelos({ searchParams: Promise.resolve({ buscar: "cat", tipoMaquinaId: "4", pagina: "2" }) }));
    expect(s.obtenerTipoMaquinaServidor).toHaveBeenCalledWith(4);
    expect(screen.getByRole("heading", { level: 1, name: "Modelos de máquina" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveValue("Vieja");
    expect(screen.getByLabelText("Buscar modelo")).toHaveValue("cat");
    expect(screen.getByRole("button", { name: "Registrar modelo" })).toBeInTheDocument();
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
    expect(listado).toHaveBeenCalledWith({ consulta: expect.any(Promise), filtros: { buscar: "cat", tipoMaquinaId: "4", estado: "", pagina: 2 } });
  });

  it("si fallan los tipos mantiene la página con los filtros vacíos", async () => {
    s.listarTiposMaquinaServidor.mockRejectedValue(new Error("x"));
    render(await PaginaModelos({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { level: 1, name: "Modelos de máquina" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filtros avanzados" }));
    expect(screen.getByRole("combobox", { name: "Tipo" })).toBeInTheDocument();
  });
});

describe("detalle de modelo (Server Component)", () => {
  it("muestra el tipo, la descripción y los activos del modelo", async () => {
    s.obtenerModeloMaquinaServidor.mockResolvedValue({ ...modelo, descripcion: "Excavadora media" });
    s.obtenerTipoMaquinaServidor.mockResolvedValue(tipo);
    s.listarActivosServidor.mockResolvedValue(pagina([activo, { ...activo, id: 6, nombre: null, numSerie: "SN-6" }]));
    render(await DetalleModelo(parametros("5")));
    expect(s.listarActivosServidor).toHaveBeenCalledWith({ buscar: "", clienteId: "", modeloMaquinaId: "5", estado: "", pagina: 1 });
    expect(screen.getByRole("heading", { level: 1, name: "CAT 320" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Activos de este modelo (2)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Excavadora" })).toHaveAttribute("href", "/activos/tipos/3");
    expect(screen.getByText("Excavadora media")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retro (SN-5)" })).toHaveAttribute("href", "/activos/5");
    expect(screen.getByRole("link", { name: "SN-6" })).toBeInTheDocument();
  });

  it("muestra vacío, «Sin descripción» y el error de carga", async () => {
    s.obtenerModeloMaquinaServidor.mockResolvedValue(modelo);
    s.obtenerTipoMaquinaServidor.mockResolvedValue(tipo);
    const { unmount } = render(await DetalleModelo(parametros("5")));
    expect(screen.getByText("No hay activos registrados con este modelo.")).toBeInTheDocument();
    expect(screen.getByText("Sin descripción")).toBeInTheDocument();
    unmount();

    s.obtenerModeloMaquinaServidor.mockRejectedValue(new Error("x"));
    render(await DetalleModelo(parametros("5")));
    expect(screen.getByText("No se pudo obtener la información del modelo de máquina solicitado.")).toBeInTheDocument();
  });
});

describe("edición y alta de modelo", () => {
  it("la edición guarda con el estado del interruptor y la acción ligada al id", async () => {
    s.obtenerModeloMaquinaServidor.mockResolvedValue(modelo);
    s.obtenerTipoMaquinaServidor.mockResolvedValue(tipo);
    s.actualizarModeloMaquinaAccion.mockResolvedValue({ exito: true, registro: modelo });
    render(await resolverServidor(await EditarModelo(parametros("5"))));
    fireEvent.click(screen.getByRole("switch", { name: "Activo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() =>
      expect(s.actualizarModeloMaquinaAccion).toHaveBeenCalledWith(5, { nombre: "CAT 320", tipoMaquinaId: 3, descripcion: null, estado: "inactivo" }),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/activos/modelos"));
  });

  it("la edición informa el error de carga y la alta muestra su formulario", async () => {
    s.obtenerModeloMaquinaServidor.mockRejectedValue(new Error("x"));
    const { unmount } = render(await resolverServidor(await EditarModelo(parametros("5"))));
    expect(screen.getByText("No se pudo obtener la información del modelo de máquina solicitado.")).toBeInTheDocument();
    unmount();
    render(await resolverServidor(await NuevoModelo()));
    expect(screen.getByLabelText("Nombre del modelo")).toBeInTheDocument();
  });

  it("la alta informa si no se pudieron cargar los tipos", async () => {
    s.listarTiposMaquinaServidor.mockRejectedValue(new Error("x"));
    render(await resolverServidor(await NuevoModelo()));
    expect(screen.getByText("No se pudo obtener el listado de tipos de máquina.")).toBeInTheDocument();
  });
});

describe("formulario de modelos", () => {
  const tipos: TipoMaquina[] = [{ id: 3, nombre: "Excavadora", estado: "activo" }, { id: 2, nombre: "Tipo 2", estado: "inactivo" }, { id: 6, nombre: "Tipo 6", estado: "inactivo" }];

  it("valida nombre y tipo y enfoca el primer campo con error", async () => {
    const accion = vi.fn();
    render(<FormularioModeloMaquina accion={accion} etiquetaConfirmacion="Guardar" tiposMaquina={tipos} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("El campo Nombre es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("Debe seleccionar un tipo de máquina.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Nombre del modelo")).toHaveFocus());

    fireEvent.change(screen.getByLabelText("Nombre del modelo"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: /Tipo de máquina/ })).toHaveFocus());
    expect(accion).not.toHaveBeenCalled();
  });

  it("solo ofrece tipos activos (más el tipo actual) y envía la descripción vacía como null", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: modelo });
    const alGuardar = vi.fn();
    render(
      <FormularioModeloMaquina
        accion={accion}
        alGuardar={alGuardar}
        etiquetaConfirmacion="Guardar"
        modeloMaquinaInicial={{ id: 5, nombre: "Antiguo", tipoMaquinaId: 2, descripcion: null, estado: "activo" }}
        tiposMaquina={tipos}
      />,
    );
    const combo = screen.getByRole("combobox", { name: /Tipo de máquina/ });
    expect(combo).toHaveValue("Tipo 2");
    fireEvent.focus(combo);
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Excavadora", "Tipo 2"]);
    fireEvent.keyDown(combo, { key: "Escape" });

    fireEvent.change(screen.getByLabelText("Descripción (opcional)"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(accion).toHaveBeenCalledWith({ nombre: "Antiguo", tipoMaquinaId: 2, descripcion: null, estado: "activo" }));
    expect(alGuardar).toHaveBeenCalledWith(modelo);
  });

  it("ubica el duplicado junto al nombre, otros errores en el banner y navega al listado al guardar", async () => {
    const accion = vi
      .fn()
      .mockResolvedValueOnce({ exito: false, errores: { nombre: "Ya existe un modelo con ese nombre." }, mensaje: "" })
      .mockResolvedValueOnce({ exito: false, errores: {}, mensaje: "Falla general" })
      .mockResolvedValueOnce({ exito: true, registro: modelo });
    render(
      <FormularioModeloMaquina
        accion={accion}
        etiquetaConfirmacion="Guardar"
        modeloMaquinaInicial={{ id: 1, nombre: "M", tipoMaquinaId: 3, descripcion: "d", estado: "activo" }}
        tiposMaquina={tipos}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    const error = await screen.findByText("Ya existe un modelo con ese nombre.");
    expect(error).toHaveAttribute("id", "nombre-error");
    expect(screen.getByLabelText("Nombre del modelo")).toHaveAttribute("aria-describedby", "nombre-error");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Falla general")).toHaveAttribute("role", "alert");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/activos/modelos"));
    expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/activos/modelos");
  });
});
