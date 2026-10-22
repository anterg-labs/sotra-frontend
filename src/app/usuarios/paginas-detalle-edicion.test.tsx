import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditarUsuario from "./[id]/editar/page";
import DetalleUsuario from "./[id]/page";
import NuevoUsuario from "./nuevo/page";
import { TablaUsuarios } from "./tabla-usuarios";
import { ProveedorSesion } from "@/componentes/sesion/contexto-sesion";
import { usuarioDePruebas } from "@/pruebas/sesion-de-pruebas";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";

const s = vi.hoisted(() => ({
  obtenerUsuarioServidor: vi.fn(),
  listarRolesServidor: vi.fn(),
  actualizarUsuarioAccion: vi.fn(),
  crearUsuarioAccion: vi.fn(),
  obtenerEstadoTerminosServidor: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: vi.fn() }) }));
vi.mock("@/componentes/ordenes-asociadas", () => ({
  OrdenesAsociadas: (p: { titulo: string; tecnicoId: string }) => <section aria-label={p.titulo} data-tecnico={p.tecnicoId} />,
}));
vi.mock("@/servicios/servidor/usuarios", () => ({
  obtenerUsuarioServidor: s.obtenerUsuarioServidor,
  listarRolesServidor: s.listarRolesServidor,
}));
vi.mock("@/servicios/servidor/terminos", () => ({ obtenerEstadoTerminosServidor: s.obtenerEstadoTerminosServidor }));
vi.mock("./acciones", () => ({
  actualizarUsuarioAccion: s.actualizarUsuarioAccion,
  crearUsuarioAccion: s.crearUsuarioAccion,
  cambiarEstadoUsuarioAccion: vi.fn(),
  restablecerContrasenaAccion: vi.fn(),
}));

const usuario = {
  id: 5, nombre: "Ana", apellido: "Pérez", correo: "ana@sotra.com", telefono: "099111222",
  roles: [{ id: 1, nombre: "Técnico", activo: true }, { id: 2, nombre: "Supervisor", activo: true }],
  estado: "activo", fechaIngreso: "2026-02-03",
};
const parametros = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  s.obtenerEstadoTerminosServidor.mockRejectedValue(new Error("sin términos"));
  s.listarRolesServidor.mockResolvedValue([{ id: 1, nombre: "Técnico" }, { id: 2, nombre: "Supervisor" }]);
});

describe("detalle de usuario (Server Component)", () => {
  it("muestra roles separados por coma y la actividad del técnico", async () => {
    s.obtenerUsuarioServidor.mockResolvedValue(usuario);
    render(await DetalleUsuario(parametros("5")));
    expect(s.obtenerUsuarioServidor).toHaveBeenCalledWith(5);
    expect(screen.getByRole("heading", { level: 1, name: "Ana Pérez" })).toBeInTheDocument();
    expect(screen.getByText("Técnico, Supervisor")).toBeInTheDocument();
    expect(screen.getByText("ana@sotra.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Actividad: órdenes de trabajo asignadas")).toHaveAttribute("data-tecnico", "5");
    expect(screen.getByRole("link", { name: "Modificar" })).toHaveAttribute("href", "/usuarios/5/editar");
  });

  it("muestra el estado de los términos y condiciones con el enlace a la pantalla de la persona", async () => {
    s.obtenerUsuarioServidor.mockResolvedValue(usuario);
    const vigente = { id: 4, version: 2 };
    s.obtenerEstadoTerminosServidor.mockResolvedValueOnce({ vigente, pendiente: false, versionAceptada: 2, aceptadoEn: "2026-10-17T15:00:00Z" });
    const { unmount } = render(await DetalleUsuario(parametros("5")));
    expect(s.obtenerEstadoTerminosServidor).toHaveBeenCalledWith(5);
    expect(screen.getByText(/Aceptó la versión 2 el 17\/10\/2026/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ver términos" })).not.toBeInTheDocument();
    unmount();

    s.obtenerEstadoTerminosServidor.mockResolvedValueOnce({ vigente, pendiente: true, versionAceptada: null, aceptadoEn: null });
    const { unmount: segundo } = render(await DetalleUsuario(parametros("5")));
    expect(screen.getByText(/^Pendiente/)).toBeInTheDocument();
    segundo();

    s.obtenerEstadoTerminosServidor.mockResolvedValueOnce({ vigente, pendiente: true, versionAceptada: 1, aceptadoEn: "2026-09-01T12:00:00Z" });
    const { unmount: tercero } = render(await DetalleUsuario(parametros("5")));
    expect(screen.getByText(/Pendiente \(última aceptada: versión 1 el 01\/09\/2026\)/)).toBeInTheDocument();
    tercero();

    s.obtenerEstadoTerminosServidor.mockRejectedValueOnce(new Error("x"));
    render(await DetalleUsuario(parametros("5")));
    expect(screen.getByText(/No se pudo consultar/)).toBeInTheDocument();
  });

  it("muestra «Sin roles» y estado inactivo, y el error de carga o de id inválido", async () => {
    s.obtenerUsuarioServidor.mockResolvedValue({ ...usuario, roles: [], estado: "inactivo" });
    const { unmount } = render(await DetalleUsuario(parametros("5")));
    expect(screen.getByText("Sin roles")).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    unmount();

    s.obtenerUsuarioServidor.mockRejectedValue(new Error("x"));
    const { unmount: desmontar } = render(await DetalleUsuario(parametros("5")));
    expect(screen.getByText("No se pudo obtener la información del usuario solicitado.")).toBeInTheDocument();
    desmontar();

    s.obtenerUsuarioServidor.mockClear();
    render(await DetalleUsuario(parametros("abc")));
    expect(screen.getByText("No se pudo obtener la información del usuario solicitado.")).toBeInTheDocument();
    expect(s.obtenerUsuarioServidor).not.toHaveBeenCalled();
  });
});

describe("edición y alta de usuario", () => {
  it("precarga el formulario y guarda con la acción ligada al id, estado y fecha de ingreso", async () => {
    s.obtenerUsuarioServidor.mockResolvedValue(usuario);
    s.actualizarUsuarioAccion.mockResolvedValue({ exito: true, registro: usuario });
    render(await EditarUsuario(parametros("5")));
    const nombre = screen.getByLabelText("Nombre");
    expect(nombre).toHaveValue("Ana");
    fireEvent.change(nombre, { target: { value: "Anabel" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() =>
      expect(s.actualizarUsuarioAccion).toHaveBeenCalledWith(
        5, "activo", "2026-02-03",
        expect.objectContaining({ nombre: "Anabel", apellido: "Pérez", correo: "ana@sotra.com", telefono: "099111222", idsRol: [1, 2] }),
      ),
    );
  });

  it("informa error si falla la carga del usuario o de los roles", async () => {
    s.obtenerUsuarioServidor.mockResolvedValue(usuario);
    s.listarRolesServidor.mockRejectedValue(new Error("x"));
    render(await EditarUsuario(parametros("5")));
    expect(screen.getByText("No se pudo obtener la información del usuario solicitado.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar modificación" })).not.toBeInTheDocument();
  });

  it("la página de alta carga los roles en el servidor y no pide contraseña", async () => {
    render(await NuevoUsuario());
    expect(screen.queryByLabelText("Contraseña")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar creación" }));
    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(s.crearUsuarioAccion).not.toHaveBeenCalled();
  });

  it("la página de alta informa si no se pudieron cargar los roles", async () => {
    s.listarRolesServidor.mockRejectedValue(new Error("x"));
    render(await NuevoUsuario());
    expect(screen.getByText("No se pudo obtener el listado de roles.")).toBeInTheDocument();
  });
});

describe("el jefe de mantenimiento gestiona usuarios, salvo administradores", () => {
  const administrador = { ...usuario, id: 35, nombre: "Admin", roles: [{ id: 9, nombre: "Administrador", activo: true }] };
  const rolesConAdministrador = [{ id: 9, nombre: "Administrador" }, { id: 1, nombre: "Técnico" }, { id: 4, nombre: "Pañolero" }];

  beforeEach(() => {
    vi.mocked(tienePermisoServidor).mockImplementation(async (permiso) => permiso !== "usuario.gestionar_administradores");
    s.listarRolesServidor.mockResolvedValue(rolesConAdministrador);
  });

  it("el alta no ofrece el rol Administrador", async () => {
    render(await NuevoUsuario());
    expect(screen.queryByRole("checkbox", { name: "Administrador" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Técnico" })).toBeInTheDocument();
  });

  it("modifica a un técnico, pero sin poder darle el rol Administrador", async () => {
    s.obtenerUsuarioServidor.mockResolvedValue(usuario);
    render(await EditarUsuario(parametros("5")));
    expect(screen.getByRole("button", { name: "Confirmar modificación" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Administrador" })).not.toBeInTheDocument();
  });

  it("no puede modificar a un administrador: ni la edición ni los botones del detalle", async () => {
    s.obtenerUsuarioServidor.mockResolvedValue(administrador);
    const { unmount } = render(await EditarUsuario(parametros("35")));
    expect(screen.getByText("Solo un administrador puede modificar a un administrador.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar modificación" })).not.toBeInTheDocument();
    unmount();

    render(await DetalleUsuario(parametros("35")));
    expect(screen.queryByRole("link", { name: "Modificar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restablecer contraseña" })).not.toBeInTheDocument();
  });

  it("en el listado, los administradores no tienen modificar ni dar de baja", () => {
    render(
      <ProveedorSesion usuario={usuarioDePruebas(["jefe_mantenimiento"])}>
        <TablaUsuarios usuarios={[usuario, administrador] as never} />
      </ProveedorSesion>,
    );
    expect(screen.getAllByRole("link", { name: "Modificar usuario" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Dar de baja" })).toHaveLength(1);
  });
});
