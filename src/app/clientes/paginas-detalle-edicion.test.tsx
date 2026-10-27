import { resolverServidor } from "@/pruebas/resolver-servidor";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContenidoEditarCliente as EditarCliente } from "./[id]/editar/contenido-editar-cliente";
import DetalleCliente from "./[id]/page";
import NuevoCliente from "./nuevo/page";
import CargandoClientes from "./loading";

const s = vi.hoisted(() => ({
  obtenerClienteServidor: vi.fn(),
  listarActivosServidor: vi.fn(),
  actualizarClienteAccion: vi.fn(),
  crearClienteAccion: vi.fn(),
}));
const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/componentes/ordenes-asociadas", () => ({
  OrdenesAsociadas: (p: { titulo: string; clienteId: string }) => <section aria-label={p.titulo} data-cliente={p.clienteId} />,
}));
vi.mock("@/servicios/servidor/clientes", () => ({ obtenerClienteServidor: s.obtenerClienteServidor }));
vi.mock("@/servicios/servidor/activos", () => ({ listarActivosServidor: s.listarActivosServidor }));
vi.mock("./acciones", () => ({ actualizarClienteAccion: s.actualizarClienteAccion, crearClienteAccion: s.crearClienteAccion }));

const cliente = {
  id: 5, razonSocial: "ACME", nombreContacto: "Luis", correo: null, telefono: "99123456", direccion: "",
  observaciones: null, cantidadActivosAsociados: 1, estado: "activo", creadoEn: "2026-01-01T00:00:00Z",
};
const activo = { id: 5, numSerie: "SN-5", nombre: "Retro" };
const pagina = (elementos: unknown[]) => ({ elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 });
const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  push.mockReset();
  s.listarActivosServidor.mockResolvedValue(pagina([]));
});

describe("detalle de cliente (Server Component)", () => {
  it("muestra los datos, «Sin dato» para vacíos, activos asociados y la actividad filtrada por cliente", async () => {
    s.obtenerClienteServidor.mockResolvedValue(cliente);
    s.listarActivosServidor.mockResolvedValue(pagina([activo, { ...activo, id: 6, nombre: null, numSerie: "SN-6" }]));
    render(await DetalleCliente(parametros("5")));
    expect(s.obtenerClienteServidor).toHaveBeenCalledWith(5);
    expect(s.listarActivosServidor).toHaveBeenCalledWith(expect.objectContaining({ clienteId: "5", pagina: 1 }));
    expect(screen.getByRole("heading", { level: 1, name: "ACME" })).toBeInTheDocument();
    expect(screen.getAllByText("Sin dato")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Retro (SN-5)" })).toHaveAttribute("href", "/activos/5");
    expect(screen.getByRole("link", { name: "SN-6" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Activos del cliente (2)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Modificar" })).toHaveAttribute("href", "/clientes/5/editar");
    expect(screen.getByRole("link", { name: "Volver al listado" })).toHaveAttribute("href", "/clientes");
    expect(screen.getByLabelText("Actividad: órdenes de trabajo del cliente")).toHaveAttribute("data-cliente", "5");
  });

  it("muestra el estado vacío de activos y tolera su fallo", async () => {
    s.obtenerClienteServidor.mockResolvedValue({ ...cliente, estado: "inactivo" });
    s.listarActivosServidor.mockRejectedValue(new Error("x"));
    render(await DetalleCliente(parametros("5")));
    expect(screen.getByText("Este cliente no tiene activos registrados.")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("informa el error si no se pudo cargar el cliente o el id no es válido", async () => {
    s.obtenerClienteServidor.mockRejectedValue(new Error("404"));
    const { unmount } = render(await DetalleCliente(parametros("5")));
    expect(screen.getByText("No se pudo obtener la información del cliente solicitado.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Detalle del cliente" })).toBeInTheDocument();
    unmount();

    s.obtenerClienteServidor.mockClear();
    render(await DetalleCliente(parametros("abc")));
    expect(screen.getByText("No se pudo obtener la información del cliente solicitado.")).toBeInTheDocument();
    expect(s.obtenerClienteServidor).not.toHaveBeenCalled();
  });
});

describe("edición y alta de cliente", () => {
  it("precarga el formulario y guarda con la acción ligada al id", async () => {
    s.obtenerClienteServidor.mockResolvedValue(cliente);
    s.actualizarClienteAccion.mockImplementation(async () => ({ exito: true, registro: cliente }));
    render(await resolverServidor(await EditarCliente(parametros("5"))));
    const razon = screen.getByLabelText("Nombre o razón social");
    expect(razon).toHaveValue("ACME");
    fireEvent.change(razon, { target: { value: "ACME SA" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() =>
      expect(s.actualizarClienteAccion).toHaveBeenCalledWith(5, expect.objectContaining({ razonSocial: "ACME SA", nombreContacto: "Luis" })),
    );
  });

  it("informa si no se pudo cargar el cliente y no muestra el formulario", async () => {
    s.obtenerClienteServidor.mockRejectedValue(new Error("x"));
    render(await resolverServidor(await EditarCliente(parametros("5"))));
    expect(screen.getByText("No se pudo obtener la información del cliente solicitado.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar modificación" })).not.toBeInTheDocument();
  });

  it("la página de alta enfoca el primer campo inválido", async () => {
    render(<NuevoCliente />);
    expect(screen.getByRole("heading", { level: 1, name: "Registrar nuevo cliente" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar registro" }));
    expect(await screen.findByText("El campo Nombre o razón social es obligatorio.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Nombre o razón social")).toHaveFocus());
    expect(s.crearClienteAccion).not.toHaveBeenCalled();
  });
});

describe("carga de la ruta", () => {
  it("muestra un esqueleto accesible", () => {
    render(<CargandoClientes />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});
