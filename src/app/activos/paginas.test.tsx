import { resolverServidor } from "@/pruebas/resolver-servidor";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioActivo } from "@/componentes/formulario-activo";
import EditarActivo from "./[id]/editar/page";
import DetalleActivo from "./[id]/page";
import PaginaActivos from "./page";
import NuevoActivo from "./nuevo/page";

const push = vi.hoisted(() => vi.fn());
const listado = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  listarActivosServidor: vi.fn(),
  obtenerActivoServidor: vi.fn(),
  listarDocumentosDeActivoServidor: vi.fn(),
  listarClientesServidor: vi.fn(),
  obtenerClienteServidor: vi.fn(),
  listarModelosMaquinaServidor: vi.fn(),
  obtenerModeloMaquinaServidor: vi.fn(),
  actualizarActivoAccion: vi.fn(),
  crearActivoAccion: vi.fn(),
  listarClientesPaginados: vi.fn(),
  listarModelosMaquinaPaginados: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/componentes/ordenes-asociadas", () => ({
  OrdenesAsociadas: (p: { titulo: string; activoId: string }) => <section aria-label={p.titulo} data-activo={p.activoId} />,
}));
vi.mock("@/servicios/servicio-clientes", () => ({ listarClientesPaginados: s.listarClientesPaginados }));
vi.mock("@/servicios/servicio-modelos-maquina", () => ({ listarModelosMaquinaPaginados: s.listarModelosMaquinaPaginados }));
vi.mock("@/servicios/servidor/activos", () => ({
  listarActivosServidor: s.listarActivosServidor,
  obtenerActivoServidor: s.obtenerActivoServidor,
  listarDocumentosDeActivoServidor: s.listarDocumentosDeActivoServidor,
}));
vi.mock("@/servicios/servidor/clientes", () => ({
  listarClientesServidor: s.listarClientesServidor,
  obtenerClienteServidor: s.obtenerClienteServidor,
}));
vi.mock("@/servicios/servidor/modelos-maquina", () => ({
  listarModelosMaquinaServidor: s.listarModelosMaquinaServidor,
  obtenerModeloMaquinaServidor: s.obtenerModeloMaquinaServidor,
}));
vi.mock("./acciones", () => ({
  actualizarActivoAccion: s.actualizarActivoAccion,
  crearActivoAccion: s.crearActivoAccion,
  cambiarEstadoActivoAccion: vi.fn(),
}));
vi.mock("./listado-activos", () => ({
  ListadoActivos: (props: unknown) => {
    listado(props);
    return <p>Listado simulado</p>;
  },
}));

const cliente = { id: 1, razonSocial: "ACME", estado: "activo" };
const clienteInactivo = { id: 11, razonSocial: "Vieja SA", estado: "inactivo" };
const modelo = { id: 2, nombre: "CAT 320", tipoMaquinaId: 3, nombreTipoMaquina: "Excavadora", estado: "activo" };
const activo = {
  id: 5, clienteId: 1, numSerie: "SN-5", descripcion: null, modeloMaquinaId: 2, anioFabricacion: null,
  nombre: "Retro", ubicacion: null, estado: "activo",
};
const pagina = (elementos: unknown[]) => ({ elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 });
const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  push.mockReset();
  listado.mockReset();
  s.listarActivosServidor.mockResolvedValue(pagina([]));
  s.listarClientesServidor.mockResolvedValue(pagina([cliente]));
  s.listarModelosMaquinaServidor.mockResolvedValue(pagina([modelo]));
  s.listarDocumentosDeActivoServidor.mockResolvedValue(pagina([]));
  vi.stubEnv("API_URL", "http://api.test");
});

describe("página del listado de activos (Server Component)", () => {
  it("lee searchParams, completa el cliente elegido que no está en la primera página y arma el listado", async () => {
    s.obtenerClienteServidor.mockResolvedValue(clienteInactivo);
    render(await PaginaActivos({ searchParams: Promise.resolve({ buscar: "sn", clienteId: "11", estado: "activo", pagina: "2" }) }));
    expect(s.obtenerClienteServidor).toHaveBeenCalledWith(11);
    expect(screen.getByRole("heading", { level: 1, name: "Gestión de activos" })).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar")).toHaveValue("sn");
    expect(screen.getByRole("combobox", { name: "Cliente" })).toHaveValue("Vieja SA");
    expect(screen.getByRole("button", { name: "Registrar nuevo activo" })).toBeInTheDocument();
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
    expect(listado).toHaveBeenCalledWith({ consulta: expect.any(Promise), filtros: { buscar: "sn", clienteId: "11", modeloMaquinaId: "", estado: "activo", pagina: 2 } });
  });

  it("si fallan los catálogos mantiene la página", async () => {
    s.listarClientesServidor.mockRejectedValue(new Error("x"));
    s.listarModelosMaquinaServidor.mockRejectedValue(new Error("y"));
    render(await PaginaActivos({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { level: 1, name: "Gestión de activos" })).toBeInTheDocument();
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
  });
});

describe("detalle de activo (Server Component)", () => {
  it("muestra datos, cliente, modelo, tipo, «Sin dato» y la documentación con su enlace de descarga", async () => {
    s.obtenerActivoServidor.mockResolvedValue(activo);
    s.obtenerClienteServidor.mockResolvedValue(cliente);
    s.obtenerModeloMaquinaServidor.mockResolvedValue(modelo);
    s.listarDocumentosDeActivoServidor.mockResolvedValue(pagina([{ id: 4, nombreArchivo: "manual.pdf" }]));
    render(await DetalleActivo(parametros("5")));
    expect(s.listarDocumentosDeActivoServidor).toHaveBeenCalledWith(5);
    expect(screen.getByRole("heading", { level: 1, name: "Retro" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ACME" })).toHaveAttribute("href", "/clientes/1");
    expect(screen.getByRole("link", { name: "CAT 320" })).toHaveAttribute("href", "/activos/modelos/2");
    expect(screen.getByRole("link", { name: "Excavadora" })).toHaveAttribute("href", "/activos/tipos/3");
    expect(screen.getAllByText("Sin dato")).toHaveLength(2);
    expect(screen.getByText("Sin descripción")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "manual.pdf" })).toHaveAttribute("href", "/api/v1/documentos-tecnicos/4/archivo");
    expect(screen.getByLabelText("Historial de órdenes de trabajo")).toHaveAttribute("data-activo", "5");
    expect(screen.getByRole("link", { name: "Modificar" })).toHaveAttribute("href", "/activos/5/editar");
  });

  it("tolera el fallo de la documentación y informa el error del activo o un id inválido", async () => {
    s.obtenerActivoServidor.mockResolvedValue({ ...activo, nombre: null, estado: "inactivo", anioFabricacion: 2020, ubicacion: "Salto", descripcion: "Notas" });
    s.obtenerClienteServidor.mockResolvedValue(cliente);
    s.obtenerModeloMaquinaServidor.mockResolvedValue(modelo);
    s.listarDocumentosDeActivoServidor.mockRejectedValue(new Error("x"));
    const { unmount } = render(await DetalleActivo(parametros("5")));
    expect(screen.getByRole("heading", { level: 1, name: "Sin nombre" })).toBeInTheDocument();
    expect(screen.getByText("Este activo no tiene documentación técnica asociada.")).toBeInTheDocument();
    expect(screen.getByText("2020")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    unmount();

    s.obtenerActivoServidor.mockRejectedValue(new Error("x"));
    const { unmount: desmontar } = render(await DetalleActivo(parametros("5")));
    expect(screen.getByText("No se pudo obtener la información del activo solicitado.")).toBeInTheDocument();
    desmontar();

    s.obtenerActivoServidor.mockClear();
    render(await DetalleActivo(parametros("abc")));
    expect(screen.getByText("No se pudo obtener la información del activo solicitado.")).toBeInTheDocument();
    expect(s.obtenerActivoServidor).not.toHaveBeenCalled();
  });
});

describe("edición y alta de activo", () => {
  it("la edición precarga, ofrece cliente y modelo actuales y guarda con el estado del interruptor", async () => {
    s.obtenerActivoServidor.mockResolvedValue({ ...activo, clienteId: 11 });
    s.obtenerClienteServidor.mockResolvedValue(clienteInactivo);
    s.obtenerModeloMaquinaServidor.mockResolvedValue(modelo);
    s.actualizarActivoAccion.mockResolvedValue({ exito: true, registro: activo });
    render(await resolverServidor(await EditarActivo(parametros("5"))));
    expect(screen.getByLabelText("Número de serie")).toHaveValue("SN-5");
    expect(screen.getByRole("combobox", { name: /Cliente asociado/ })).toHaveValue("Vieja SA");
    fireEvent.click(screen.getByRole("switch", { name: "Activo" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() =>
      expect(s.actualizarActivoAccion).toHaveBeenCalledWith(
        5, expect.objectContaining({ clienteId: 11, modeloMaquinaId: 2, numSerie: "SN-5", nombre: "Retro", estado: "inactivo" }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/activos"));
  });

  it("la edición informa el error de carga", async () => {
    s.obtenerActivoServidor.mockRejectedValue(new Error("x"));
    render(await resolverServidor(await EditarActivo(parametros("5"))));
    expect(screen.getByText("No se pudo obtener la información del activo solicitado.")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("la página de alta carga clientes y modelos activos en el servidor", async () => {
    render(await resolverServidor(await NuevoActivo()));
    expect(screen.getByLabelText("Número de serie")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});

describe("formulario de activos", () => {
  it("enfoca el primer campo inválido y anuncia el error", async () => {
    const accion = vi.fn();
    render(<FormularioActivo accion={accion} clientes={[]} etiquetaConfirmacion="Crear activo" modelosMaquina={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear activo" }));
    await waitFor(() => expect(screen.getByLabelText("Número de serie")).toHaveFocus());
    expect(screen.getByText("El campo Número de serie es obligatorio.")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Debe seleccionar un cliente.")).toBeInTheDocument();
    expect(accion).not.toHaveBeenCalled();
  });

  it("permite elegir cliente y modelo fuera de la primera página y envía sus IDs", async () => {
    s.listarClientesPaginados.mockResolvedValue({ elementos: [{ id: 42, razonSocial: "Cliente remoto" }] });
    s.listarModelosMaquinaPaginados.mockResolvedValue({ elementos: [{ id: 84, nombre: "Modelo remoto" }] });
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: activo });
    render(<FormularioActivo accion={accion} clientes={[]} etiquetaConfirmacion="Crear activo" modelosMaquina={[]} />);
    fireEvent.change(screen.getByLabelText("Número de serie"), { target: { value: "SERIE-001" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Cliente asociado" }), { target: { value: "remoto" } });
    fireEvent.click(await screen.findByRole("option", { name: "Cliente remoto" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Modelo de máquina" }), { target: { value: "remoto" } });
    fireEvent.click(await screen.findByRole("option", { name: "Modelo remoto" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear activo" }));
    await waitFor(() => expect(accion).toHaveBeenCalledWith(expect.objectContaining({ clienteId: 42, modeloMaquinaId: 84, numSerie: "SERIE-001" })));
  });

  it("ubica el número de serie duplicado junto al campo y enfoca su control", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: false, errores: { numSerie: "El número de serie ya está registrado." }, mensaje: "" });
    render(
      <FormularioActivo accion={accion} activoInicial={activo as never} clientes={[cliente as never]} etiquetaConfirmacion="Guardar" modelosMaquina={[modelo as never]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    const error = await screen.findByText("El número de serie ya está registrado.");
    expect(error).toHaveAttribute("id", "numeroSerie-error");
    await waitFor(() => expect(screen.getByLabelText("Número de serie")).toHaveFocus());
    expect(screen.getByLabelText("Número de serie")).toHaveAttribute("aria-describedby", "numeroSerie-error");
  });
});
