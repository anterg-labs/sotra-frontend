import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { Cliente } from "@/tipos/cliente";
import { FormularioCliente } from "./formulario-cliente";

const push = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso }) }));

const clienteGuardado: Cliente = {
  id: 9, razonSocial: "Cliente prueba", nombreContacto: "Ana Pérez", correo: null, telefono: "99123456", direccion: null,
  observaciones: null, cantidadActivosAsociados: 0, estado: "activo", creadoEn: "2026-01-01T00:00:00Z",
};

function completar(telefono = "") {
  fireEvent.change(screen.getByLabelText("Nombre o razón social"), { target: { value: "Cliente prueba" } });
  fireEvent.change(screen.getByLabelText("Nombre de contacto"), { target: { value: "Ana Pérez" } });
  if (telefono) fireEvent.change(screen.getByLabelText("Número telefónico (opcional)"), { target: { value: telefono } });
}

describe("formulario de clientes", () => {
  beforeEach(() => {
    push.mockReset();
    mostrarAviso.mockReset();
  });

  it("muestra el error junto al campo y lleva el foco al primero inválido sin llamar a la acción", async () => {
    const accion = vi.fn();
    render(<FormularioCliente accion={accion} etiquetaConfirmacion="Guardar" />);

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.getByLabelText("Nombre o razón social")).toHaveFocus());
    expect(screen.getByText("El campo Nombre o razón social es obligatorio.")).toHaveAttribute("role", "alert");
    expect(accion).not.toHaveBeenCalled();
  });

  it("muestra un teléfono duplicado junto al campo y conserva lo escrito", async () => {
    const accion = vi.fn<(c: unknown) => Promise<ResultadoGuardar<Cliente>>>().mockResolvedValue({
      exito: false, errores: { telefono: "El número telefónico ya está registrado." }, mensaje: "",
    });
    render(<FormularioCliente accion={accion} etiquetaConfirmacion="Guardar" />);
    completar("99123456");
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.getByText("El número telefónico ya está registrado.")).toHaveAttribute("id", "telefono-error"));
    expect(screen.getByLabelText("Número telefónico (opcional)")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Número telefónico (opcional)")).toHaveFocus();
    expect(screen.getByLabelText("Nombre o razón social")).toHaveValue("Cliente prueba");
    expect(screen.queryByText("No se pudo guardar la información del cliente.")).toBeNull();
  });

  it("envía los opcionales vacíos como null, avisa y vuelve al listado", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: clienteGuardado });
    render(<FormularioCliente accion={accion} etiquetaConfirmacion="Guardar" />);
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/clientes"));
    expect(accion).toHaveBeenCalledWith({
      razonSocial: "Cliente prueba", nombreContacto: "Ana Pérez", correo: null, telefono: null, direccion: null, observaciones: null,
    });
    expect(mostrarAviso).toHaveBeenCalledWith("exito", "Cliente registrado.");
  });

  it("al modificar avisa «Cliente actualizado.» y precarga los datos", async () => {
    const accion = vi.fn().mockResolvedValue({ exito: true, registro: clienteGuardado });
    render(
      <FormularioCliente
        accion={accion}
        clienteInicial={{ razonSocial: "ACME", nombreContacto: "Luis", correo: null, telefono: "99123456", direccion: null, observaciones: null }}
        etiquetaConfirmacion="Confirmar modificación"
      />,
    );
    expect(screen.getByLabelText("Nombre o razón social")).toHaveValue("ACME");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar modificación" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Cliente actualizado."));
  });

  it("con alGuardar no navega y entrega el cliente guardado", async () => {
    const alGuardar = vi.fn();
    render(
      <FormularioCliente
        accion={vi.fn().mockResolvedValue({ exito: true, registro: clienteGuardado })}
        alGuardar={alGuardar}
        etiquetaConfirmacion="Guardar"
      />,
    );
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(alGuardar).toHaveBeenCalledWith(clienteGuardado));
    expect(push).not.toHaveBeenCalled();
  });

  it("muestra el mensaje general del servidor y ante una excepción no expone detalles", async () => {
    const accion = vi
      .fn()
      .mockResolvedValueOnce({ exito: false, errores: {}, mensaje: "No se pudo crear el cliente." })
      .mockRejectedValueOnce(new Error("ECONNREFUSED 10.0.0.1"));
    render(<FormularioCliente accion={accion} etiquetaConfirmacion="Guardar" />);
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("No se pudo crear el cliente.")).toHaveAttribute("role", "alert");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("No se pudo guardar la información del cliente.")).toBeInTheDocument();
    expect(screen.queryByText(/ECONNREFUSED/)).toBeNull();
  });

  it("deshabilita el botón y muestra «Guardando…» mientras la acción está en curso", async () => {
    let resolver: (r: ResultadoGuardar<Cliente>) => void = () => undefined;
    const accion = vi.fn().mockReturnValue(new Promise<ResultadoGuardar<Cliente>>((resolve) => { resolver = resolve; }));
    render(<FormularioCliente accion={accion} etiquetaConfirmacion="Guardar" />);
    completar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    const boton = await screen.findByRole("button", { name: "Guardando…" });
    expect(boton).toBeDisabled();
    resolver({ exito: true, registro: clienteGuardado });
    await waitFor(() => expect(push).toHaveBeenCalled());
  });
});
