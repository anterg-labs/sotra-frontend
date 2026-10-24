import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaginaUsuarios from "./page";

const listado = vi.hoisted(() => vi.fn());
const listarRolesServidor = vi.hoisted(() => vi.fn());
const listarUsuariosServidor = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/servicios/servidor/usuarios", () => ({ listarRolesServidor, listarUsuariosServidor }));
vi.mock("./acciones", () => ({ cambiarEstadoUsuarioAccion: vi.fn(), crearUsuarioAccion: vi.fn() }));
vi.mock("./listado-usuarios", () => ({
  ListadoUsuarios: (props: unknown) => {
    listado(props);
    return <p>Listado simulado</p>;
  },
}));

beforeEach(() => {
  listado.mockReset();
  listarRolesServidor.mockReset();
  listarUsuariosServidor.mockReset().mockResolvedValue({ elementos: [] });
  listarRolesServidor.mockResolvedValue([{ id: 1, nombre: "Administrador", estado: "activo" }, { id: 2, nombre: "Técnico", estado: "activo" }]);
});

describe("página del listado de usuarios (Server Component)", () => {
  it("empieza a obtener usuarios mientras el catálogo de roles sigue pendiente", async () => {
    let completarRoles = () => {};
    listarRolesServidor.mockReturnValue(new Promise((resolver) => { completarRoles = () => resolver([]); }));
    const pagina = PaginaUsuarios({ searchParams: Promise.resolve({ buscar: "ana" }) });
    await waitFor(() => expect(listarUsuariosServidor).toHaveBeenCalledWith({ buscar: "ana", rolId: "", estado: "", pagina: 1 }));
    completarRoles();
    await pagina;
  });
  it("lee searchParams, carga los roles en el servidor y arma filtros, alta y listado", async () => {
    render(await PaginaUsuarios({ searchParams: Promise.resolve({ buscar: "ana", rolId: "2", pagina: "2" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Gestión de usuarios" })).toBeInTheDocument();
    expect(screen.getByLabelText("Buscar")).toHaveValue("ana");
    expect(screen.getByLabelText("Rol")).toHaveValue("2");
    expect(within(screen.getByLabelText("Rol")).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Todos los roles", "Administrador", "Técnico",
    ]);
    expect(screen.getByRole("button", { name: "Crear nuevo usuario" })).toBeInTheDocument();
    expect(await screen.findByText("Listado simulado")).toBeInTheDocument();
    expect(listado).toHaveBeenCalledWith({ consulta: expect.any(Promise), filtros: { buscar: "ana", rolId: "2", estado: "", pagina: 2 } });
  });

  it("si fallan los roles muestra el error y mantiene la página", async () => {
    listarRolesServidor.mockRejectedValue(new Error("y"));
    render(await PaginaUsuarios({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No se pudo obtener el listado de roles.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Gestión de usuarios" })).toBeInTheDocument();
  });
});
