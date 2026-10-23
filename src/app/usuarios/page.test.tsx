import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProveedorNavegacionListado } from "@/componentes/listado/navegacion-listado";
import { esperarRetardoDeBusqueda } from "@/pruebas/ayudas-filtros";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { AltaUsuarioModal } from "./alta-usuario-modal";
import { BarraFiltrosUsuarios } from "./barra-filtros-usuarios";
import { construirUrlUsuarios, leerFiltrosUsuarios } from "./filtros";
import { ListadoUsuarios } from "./listado-usuarios";
import { TablaUsuarios } from "./tabla-usuarios";

const push = vi.hoisted(() => vi.fn());
const replace = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({ listarUsuariosServidor: vi.fn(), listarRolesServidor: vi.fn() }));
const cambiarEstadoUsuarioAccion = vi.hoisted(() => vi.fn());
const crearUsuarioAccion = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));
vi.mock("@/servicios/servidor/usuarios", () => s);
vi.mock("./acciones", () => ({ cambiarEstadoUsuarioAccion, crearUsuarioAccion, actualizarUsuarioAccion: vi.fn() }));

function usuario(id: number, roles: string[], estado: "activo" | "inactivo" = "activo") {
  return {
    id,
    nombre: "Nombre" + id,
    apellido: "Apellido" + id,
    correo: `u${id}@sotra.com`,
    telefono: "99111222",
    roles: roles.map((nombre, i) => ({ id: i + 1, nombre, activo: true })),
    estado,
    fechaIngreso: "2026-01-01",
    cantidadOrdenesAsignadas: 0,
  };
}

const pagina = (elementos: ReturnType<typeof usuario>[], totalPaginas = 1) => ({
  elementos,
  pagina: 1,
  tamanoPagina: 20,
  totalElementos: elementos.length,
  totalPaginas,
});

const roles = [{ id: 1, nombre: "Administrador" }, { id: 2, nombre: "Técnico" }];
const filtrosVacios = { buscar: "", rolId: "", estado: "", pagina: 1 };
const conNavegacion = (ui: React.ReactNode) => <ProveedorNavegacionListado etiquetaCarga="Cargando usuarios…">{ui}</ProveedorNavegacionListado>;

beforeEach(() => {
  [push, replace, mostrarAviso, cambiarEstadoUsuarioAccion, crearUsuarioAccion, ...Object.values(s)].forEach((f) => f.mockReset());
  s.listarRolesServidor.mockResolvedValue(roles);
  s.listarUsuariosServidor.mockResolvedValue(
    pagina([usuario(1, []), usuario(2, ["Técnico"]), usuario(3, ["Administrador", "Técnico"], "inactivo")]),
  );
});

describe("filtros de la URL de usuarios", () => {
  it("muestra cero y el total de órdenes asignadas y permite ordenar por esa columna", () => {
    render(conNavegacion(<TablaUsuarios filtros={filtrosVacios} usuarios={[usuario(1, []), { ...usuario(2, ["Técnico"]), cantidadOrdenesAsignadas: 4 }]} />));
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByRole("cell", { name: "0" })).toBeInTheDocument();
    expect(within(filas[2]).getByRole("cell", { name: "4" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Órdenes asignadas/ }));
    expect(push).toHaveBeenLastCalledWith(expect.stringContaining("ordenarPor=cantidadOrdenesAsignadas"));
    expect(leerFiltrosUsuarios({ ordenarPor: "cantidadOrdenesAsignadas" }).ordenarPor).toBe("cantidadOrdenesAsignadas");
  });
  it("lee los filtros con valores seguros y arma la URL", () => {
    expect(leerFiltrosUsuarios({})).toEqual(filtrosVacios);
    expect(leerFiltrosUsuarios({ buscar: "ana", rolId: "2", estado: "activo", pagina: "3" })).toEqual({
      buscar: "ana", rolId: "2", estado: "activo", pagina: 3,
    });
    expect(leerFiltrosUsuarios({ rolId: "x; DROP", estado: "otro", pagina: "0" })).toEqual(filtrosVacios);
    expect(construirUrlUsuarios({ buscar: "ana", rolId: "2", estado: "", pagina: 2 })).toBe("/usuarios?buscar=ana&rolId=2&pagina=2");
  });
});

describe("listado de usuarios (Server Component)", () => {
  it("muestra roles según la cantidad asignada y las acciones según el estado", async () => {
    render(conNavegacion(await ListadoUsuarios({ filtros: { ...filtrosVacios, buscar: "x" } })));
    expect(s.listarUsuariosServidor).toHaveBeenCalledWith({ ...filtrosVacios, buscar: "x" });
    const filas = screen.getAllByRole("row");
    expect(within(filas[1]).getByText("Sin roles")).toBeInTheDocument();
    expect(within(filas[2]).getByText("Técnico")).toBeInTheDocument();
    expect(within(filas[3]).getByText("2 roles")).toBeInTheDocument();
    expect(within(filas[3]).getByText("Inactivo")).toBeInTheDocument();
    expect(within(filas[3]).queryByRole("button", { name: "Dar de baja" })).not.toBeInTheDocument();
    expect(within(filas[3]).getByRole("button", { name: "Reactivar usuario" })).toBeInTheDocument();
    expect(within(filas[2]).queryByRole("button", { name: "Reactivar usuario" })).not.toBeInTheDocument();
    expect(within(filas[2]).getByRole("link", { name: "Modificar usuario" })).toHaveAttribute("href", "/usuarios/2/editar");
    expect(within(filas[2]).getByRole("link", { name: "Ver detalle" })).toHaveAttribute("href", "/usuarios/2");
  });

  it("informa el error de carga y el estado vacío", async () => {
    s.listarUsuariosServidor.mockRejectedValueOnce(new Error("x"));
    const { unmount } = render(await ListadoUsuarios({ filtros: filtrosVacios }));
    expect(screen.getByText("No se pudo obtener el listado de usuarios.")).toBeInTheDocument();
    unmount();
    s.listarUsuariosServidor.mockResolvedValue(pagina([]));
    render(await ListadoUsuarios({ filtros: filtrosVacios }));
    expect(screen.getByText("No se encontraron usuarios con los filtros aplicados.")).toBeInTheDocument();
  });

  it("muestra la paginación con el total de usuarios", async () => {
    s.listarUsuariosServidor.mockResolvedValue(pagina([usuario(1, ["Técnico"])], 2));
    render(conNavegacion(await ListadoUsuarios({ filtros: { ...filtrosVacios, rolId: "2" } })));
    expect(screen.getByText("Página 1 de 2 (1 usuarios)")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(push).toHaveBeenLastCalledWith("/usuarios?rolId=2&pagina=2");
  });
});

describe("barra de filtros de usuarios (en vivo)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("el texto espera el retardo; rol y estado aplican al instante; no hay botón «Aplicar filtros»", async () => {
    vi.useFakeTimers();
    render(conNavegacion(<BarraFiltrosUsuarios filtros={{ ...filtrosVacios, pagina: 4 }} roles={roles} />));
    expect(screen.queryByRole("button", { name: "Aplicar filtros" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "ana" } });
    expect(replace).not.toHaveBeenCalled();
    await esperarRetardoDeBusqueda();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenLastCalledWith("/usuarios?buscar=ana");

    fireEvent.change(screen.getByLabelText("Rol"), { target: { value: "2" } });
    expect(replace).toHaveBeenLastCalledWith("/usuarios?buscar=ana&rolId=2");
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "activo" } });
    expect(replace).toHaveBeenLastCalledWith("/usuarios?buscar=ana&rolId=2&estado=activo");
    expect(push).not.toHaveBeenCalled();
  });

  it("limpia los filtros", () => {
    render(conNavegacion(<BarraFiltrosUsuarios filtros={{ buscar: "ana", rolId: "2", estado: "activo", pagina: 1 }} roles={roles} />));
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(replace).toHaveBeenLastCalledWith("/usuarios");
    expect(screen.getByLabelText("Buscar")).toHaveValue("");
    expect(screen.getByLabelText("Rol")).toHaveValue("");
  });
});

describe("tabla de usuarios (baja)", () => {
  const usuarios = [usuario(1, []), usuario(2, ["Técnico"], "inactivo")];

  it("confirma la desactivación mostrando el nombre y llama a la acción", async () => {
    cambiarEstadoUsuarioAccion.mockResolvedValue({ exito: true });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaUsuarios usuarios={usuarios} filtros={{ buscar: "", rolId: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    const dialogo = screen.getByRole("dialog", { name: "Desactivar usuario" });
    expect(dialogo).toHaveTextContent("Nombre1 Apellido1");
    expect(cambiarEstadoUsuarioAccion).not.toHaveBeenCalled();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(cambiarEstadoUsuarioAccion).toHaveBeenCalledWith(1, "inactivo"));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Usuario dado de baja."));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancelar no llama a la acción y un fallo muestra el error", async () => {
    cambiarEstadoUsuarioAccion.mockResolvedValue({ exito: false, mensaje: "No se pudo desactivar el usuario seleccionado." });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaUsuarios usuarios={usuarios} filtros={{ buscar: "", rolId: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(cambiarEstadoUsuarioAccion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Dar de baja" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("error", "No se pudo desactivar el usuario seleccionado."));
    expect(mostrarAviso).not.toHaveBeenCalledWith("exito", expect.anything(), expect.anything());
  });

  it("pide confirmación antes de reactivar un usuario inactivo y luego llama a la acción con el estado activo", async () => {
    cambiarEstadoUsuarioAccion.mockResolvedValue({ exito: true });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaUsuarios usuarios={usuarios} filtros={{ buscar: "", rolId: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Reactivar usuario" }));
    const dialogo = screen.getByRole("dialog", { name: "Reactivar usuario" });
    expect(dialogo).toHaveTextContent("Nombre2 Apellido2");
    expect(cambiarEstadoUsuarioAccion).not.toHaveBeenCalled();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Reactivar" }));
    await waitFor(() => expect(cambiarEstadoUsuarioAccion).toHaveBeenCalledWith(2, "activo"));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Usuario reactivado."));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("cancelar la reactivación no llama a la acción", () => {
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaUsuarios usuarios={usuarios} filtros={{ buscar: "", rolId: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Reactivar usuario" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(cambiarEstadoUsuarioAccion).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("si falla la reactivación muestra el error", async () => {
    cambiarEstadoUsuarioAccion.mockResolvedValue({ exito: false, mensaje: "No se pudo reactivar el usuario." });
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaUsuarios usuarios={usuarios} filtros={{ buscar: "", rolId: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    fireEvent.click(screen.getByRole("button", { name: "Reactivar usuario" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reactivar" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("error", "No se pudo reactivar el usuario."));
  });

  it("resalta el usuario recién creado", () => {
    render(<ProveedorNavegacionListado etiquetaCarga="Cargando"><TablaUsuarios usuarios={usuarios} filtros={{ buscar: "", rolId: "", estado: "", pagina: 1 }} /></ProveedorNavegacionListado>);
    act(() => marcarCreado("usuarios", 2));
    expect(screen.getAllByRole("row")[2]).toHaveClass("fila-nueva");
  });
});

describe("alta de usuario en modal", () => {
  it("abre el formulario y, al guardar, cierra, resalta y avisa", async () => {
    crearUsuarioAccion.mockResolvedValue({ exito: true, registro: { ...usuario(9, ["Técnico"]), correoDeContrasenaEnviado: true } });
    render(<AltaUsuarioModal roles={roles} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear nuevo usuario" }));
    const dialogo = await screen.findByRole("dialog", { name: "Crear nuevo usuario" });
    fireEvent.change(within(dialogo).getByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.change(within(dialogo).getByLabelText("Apellido"), { target: { value: "Pérez" } });
    fireEvent.change(within(dialogo).getByLabelText("Correo electrónico"), { target: { value: "ana@sotra.com" } });
    fireEvent.change(within(dialogo).getByLabelText("Número de teléfono"), { target: { value: "99111222" } });
    expect(within(dialogo).queryByLabelText("Contraseña")).not.toBeInTheDocument();
    fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar creación" }));
    await waitFor(() =>
      expect(mostrarAviso).toHaveBeenCalledWith("exito", "Usuario creado. Se envió un correo a " + usuario(9, ["Técnico"]).correo + " para que elija su contraseña."),
    );
    expect(crearUsuarioAccion).toHaveBeenCalledWith({ nombre: "Ana", apellido: "Pérez", correo: "ana@sotra.com", telefono: "99111222", idsRol: [] });
  });

  it.each([false, undefined, null])("el modal informa el correo %s sin anunciar un envío ni repetir el alta", async (correoDeContrasenaEnviado) => {
    crearUsuarioAccion.mockResolvedValue({ exito: true, registro: { ...usuario(9, ["Técnico"]), correoDeContrasenaEnviado } });
    render(<AltaUsuarioModal roles={roles} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear nuevo usuario" }));
    const dialogo = await screen.findByRole("dialog", { name: "Crear nuevo usuario" });
    fireEvent.change(within(dialogo).getByLabelText("Nombre"), { target: { value: "Ana" } });
    fireEvent.change(within(dialogo).getByLabelText("Apellido"), { target: { value: "Pérez" } });
    fireEvent.change(within(dialogo).getByLabelText("Correo electrónico"), { target: { value: "ana@sotra.com" } });
    fireEvent.change(within(dialogo).getByLabelText("Número de teléfono"), { target: { value: "99111222" } });
    fireEvent.click(within(dialogo).getByRole("button", { name: "Confirmar creación" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mostrarAviso).toHaveBeenCalledWith(correoDeContrasenaEnviado === false ? "advertencia" : "info", expect.stringContaining("Usuario creado"));
    expect(mostrarAviso).not.toHaveBeenCalledWith("exito", expect.stringContaining("Se envió un correo"));
    expect(crearUsuarioAccion).toHaveBeenCalledTimes(1);
  });

  it("sin roles o con error de roles lo informa en lugar del formulario", () => {
    const { unmount } = render(<AltaUsuarioModal roles={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear nuevo usuario" }));
    expect(screen.getByText("No hay roles disponibles.")).toBeInTheDocument();
    unmount();
    render(<AltaUsuarioModal roles={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear nuevo usuario" }));
    expect(screen.getByText("No se pudo obtener el listado de roles.")).toBeInTheDocument();
  });
});
