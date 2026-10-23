import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioUsuario } from "./formulario-usuario";

const push = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));

const usuario = {
  id: 3, nombre: "Ana", apellido: "Pérez", correo: "ana@ejemplo.com", telefono: "99123456", roles: [],
  estado: "activo", fechaIngreso: "2026-01-01",
};

function completar() {
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: "Pérez" } });
  fireEvent.change(screen.getByLabelText("Correo electrónico"), { target: { value: "ana@ejemplo.com" } });
  fireEvent.change(screen.getByLabelText("Número de teléfono"), { target: { value: "99123456" } });
}

describe("formulario de usuarios", () => {
  beforeEach(() => {
    push.mockReset();
    mostrarAviso.mockReset();
  });

  it("muestra los roles sin desplegable y permite seleccionar varios y quitar uno sin perder los otros", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: usuario });
    render(<FormularioUsuario accion={accion} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios"
      roles={[{ id: 1, nombre: "Administrador" }, { id: 2, nombre: "Técnico" }]}
      usuarioInicial={{ nombre: "Ana", apellido: "Pérez", correo: "ana@ejemplo.com", telefono: "99123456", idsRol: [1], estado: "activo", fechaIngreso: "2026-01-01" }} />);
    expect(screen.getByRole("group", { name: "Roles" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Administrador" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Técnico" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(accion).toHaveBeenLastCalledWith(expect.objectContaining({ idsRol: [1, 2] })));
    fireEvent.click(screen.getByRole("checkbox", { name: "Administrador" }));
    expect(screen.getByRole("checkbox", { name: "Técnico" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(accion).toHaveBeenLastCalledWith(expect.objectContaining({ idsRol: [2] })));
  });

  it("muestra un teléfono duplicado junto al campo", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: false, errores: { telefono: "El número de teléfono ya está registrado." }, mensaje: "" });
    render(<FormularioUsuario accion={accion} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.getByText("El número de teléfono ya está registrado.")).toHaveAttribute("id", "telefono-error"));
    expect(screen.getByLabelText("Número de teléfono")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Número de teléfono")).toHaveFocus();
  });

  it("lleva el foco al primer campo inválido sin llamar a la acción", async () => {
    const accion = vi.fn();
    render(<FormularioUsuario accion={accion} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByLabelText("Nombre")).toHaveFocus());
    expect(screen.getByText("El campo Nombre es obligatorio.")).toHaveAttribute("role", "alert");
    expect(accion).not.toHaveBeenCalled();
  });

  it("no pide contraseña: en el alta avisa que llega un correo para elegirla", () => {
    render(<FormularioUsuario accion={vi.fn()} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    expect(screen.queryByLabelText("Contraseña")).not.toBeInTheDocument();
    expect(document.querySelector("input[type=password]")).toBeNull();
    expect(screen.getByText(/le llega un correo para que elija la suya/)).toBeInTheDocument();
  });

  it("al guardar avisa y vuelve al listado; en edición avisa «Usuario actualizado.»", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: usuario });
    const { unmount } = render(<FormularioUsuario accion={accion} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/usuarios"));
    expect(mostrarAviso).toHaveBeenCalledWith("exito", "Usuario creado. Se envió un correo a " + usuario.correo + " para que elija su contraseña.");
    expect(accion).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Ana", telefono: "99123456", idsRol: [] }));
    unmount();

    render(
      <FormularioUsuario
        accion={accion}
        etiquetaConfirmacion="Guardar"
        rutaCancelar="/usuarios"
        rutaExito="/usuarios"
        usuarioInicial={{ nombre: "Ana", apellido: "Pérez", correo: "ana@ejemplo.com", telefono: "99123456", idsRol: [1], estado: "activo", fechaIngreso: "2026-01-01" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Usuario actualizado."));
  });

  it("con alGuardar no navega; el mensaje general del servidor se muestra como alerta", async () => {
    const alGuardar = vi.fn();
    const accion = vi
      .fn()
      .mockResolvedValueOnce({ exito: false, errores: {}, mensaje: "Debe seleccionar al menos un rol." })
      .mockResolvedValueOnce({ exito: true, registro: usuario });
    render(<FormularioUsuario accion={accion} alGuardar={alGuardar} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Debe seleccionar al menos un rol.")).toHaveAttribute("role", "alert");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(alGuardar).toHaveBeenCalledWith(usuario));
    expect(push).not.toHaveBeenCalled();
  });
});
