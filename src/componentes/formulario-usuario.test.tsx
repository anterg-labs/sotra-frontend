import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioUsuario } from "./formulario-usuario";

const push = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));

const usuario = {
  id: 3, nombre: "Ana", apellido: "Pérez", correo: "ana@ejemplo.com", telefono: "99123456", roles: [],
  estado: "activo", fechaIngreso: "2026-01-01", correoDeContrasenaEnviado: true,
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
      roles={[{ id: 1, nombre: "Administrador", estado: "activo" }, { id: 2, nombre: "Técnico", estado: "activo" }]}
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

  it("sugiere el formato del teléfono con un texto de ejemplo", () => {
    render(<FormularioUsuario accion={vi.fn()} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    expect(screen.getByLabelText("Número de teléfono")).toHaveAttribute("placeholder", "099123456");
    expect(screen.getByLabelText("Número de teléfono")).not.toHaveAccessibleDescription();
  });

  it.each(["99123456", "099123456", "092624911"])("envía el alta con el teléfono válido %s sin truncarlo", async (telefono) => {
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: usuario });
    render(<FormularioUsuario accion={accion} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    completar();
    fireEvent.change(screen.getByLabelText("Número de teléfono"), { target: { value: telefono } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(accion).toHaveBeenCalledWith(expect.objectContaining({ telefono })));
    expect(screen.getByLabelText("Número de teléfono")).not.toHaveAttribute("aria-invalid", "true");
  });

  it.each(["9912345", "991234567", "0991234567"])("rechaza el teléfono %s que no cumple la excepción del cero inicial", async (telefono) => {
    const accion = vi.fn();
    render(<FormularioUsuario accion={accion} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    completar();
    fireEvent.change(screen.getByLabelText("Número de teléfono"), { target: { value: telefono } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("El campo teléfono debe tener 8 dígitos (o 9 si empieza con 0).")).toHaveAttribute("role", "alert");
    expect(accion).not.toHaveBeenCalled();
  });

  it("muestra la falta de rol junto al grupo de roles", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: false, errores: { idsRol: "Debe seleccionar al menos un rol." }, mensaje: "" });
    render(<FormularioUsuario accion={accion} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios"
      roles={[{ id: 1, nombre: "Administrador", estado: "activo" }]} />);
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    const error = await screen.findByText("Debe seleccionar al menos un rol.");
    expect(error).toHaveAttribute("id", "roles-error");
    expect(screen.getByRole("group", { name: "Roles" })).toHaveAttribute("aria-describedby", "roles-error");
    expect(push).not.toHaveBeenCalled();
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
    expect(screen.getByText("Se debe revisar el correo para configurar la contraseña de acceso.")).toBeInTheDocument();
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

  it.each([
    [false, "advertencia", "Usuario creado, pero no se pudo enviar el correo para elegir su contraseña. Usá «Reenviar enlace de contraseña» desde el detalle del usuario."],
    [undefined, "info", "Usuario creado. No se envió un nuevo correo de contraseña. Si lo necesita, usá «Reenviar enlace de contraseña» desde su detalle."],
    [null, "info", "Usuario creado. No se envió un nuevo correo de contraseña. Si lo necesita, usá «Reenviar enlace de contraseña» desde su detalle."],
  ])("no anuncia envío cuando el resultado es %s y conserva el alta", async (correoDeContrasenaEnviado, tipo, texto) => {
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: { ...usuario, correoDeContrasenaEnviado } });
    render(<FormularioUsuario accion={accion} etiquetaConfirmacion="Guardar" rutaCancelar="/usuarios" rutaExito="/usuarios" />);
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/usuarios"));
    expect(mostrarAviso).toHaveBeenCalledWith(tipo, texto);
    expect(mostrarAviso).not.toHaveBeenCalledWith("exito", expect.stringContaining("Se envió un correo"));
    expect(accion).toHaveBeenCalledTimes(1);
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
