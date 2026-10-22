import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usuarioDePruebas } from "@/pruebas/sesion-de-pruebas";
import { MenuUsuario } from "./menu-usuario";

afterEach(cleanup);
const usuario = usuarioDePruebas(["jefe_mantenimiento", "tecnico"], { nombre: "Nicolás Díaz", correo: "nicolas@sotra.test" });

describe("Menú de usuario", () => {
  it("muestra la identidad y permite abrir, cerrar con Escape y devolver el foco", () => {
    render(<MenuUsuario usuario={usuario} alCerrarSesion={vi.fn()} />);
    const boton = screen.getByRole("button", { name: "Menú de usuario: Nicolás Díaz" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).not.toBeInTheDocument();
    fireEvent.click(boton);
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeEnabled();
    expect(boton.querySelector(".usuario-avatar")).toHaveTextContent("ND");
    expect(screen.getByText("nicolas@sotra.test")).toBeInTheDocument();
    expect(screen.getByText("Jefe de mantenimiento, Técnico")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(boton).toHaveFocus();
  });

  it("cierra al pulsar fuera y al sacar el foco del control", () => {
    render(<><MenuUsuario usuario={usuario} alCerrarSesion={vi.fn()} /><button>Otro control</button></>);
    const boton = screen.getByRole("button", { name: /Menú de usuario/ });
    fireEvent.click(boton);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Otro control" }));
    expect(boton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(boton);
    fireEvent.blur(screen.getByRole("button", { name: "Cerrar sesión" }), { relatedTarget: screen.getByRole("button", { name: "Otro control" }) });
    expect(boton).toHaveAttribute("aria-expanded", "false");
  });

  it("sin identidad igualmente permite cerrar sesión", () => {
    const salir = vi.fn();
    render(<MenuUsuario usuario={null} alCerrarSesion={salir} />);
    fireEvent.click(screen.getByRole("button", { name: /Menú de usuario/ }));
    expect(screen.getByText("Sin sesión")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(salir).toHaveBeenCalledTimes(1);
  });

  it("evita envíos repetidos mientras se cierra y oculta el panel al terminar", async () => {
    let terminar = () => {};
    const salir = vi.fn(() => new Promise<void>(resolver => { terminar = resolver; }));
    render(<MenuUsuario usuario={usuario} alCerrarSesion={salir} />);
    fireEvent.click(screen.getByRole("button", { name: /Menú de usuario/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(screen.getByRole("button", { name: "Cerrando sesión…" })).toBeDisabled();
    expect(salir).toHaveBeenCalledTimes(1);
    terminar();
    await waitFor(() => expect(screen.getByRole("button", { name: /Menú de usuario/ })).toHaveAttribute("aria-expanded", "false"));
  });

  it("mantiene el panel abierto con un error recuperable si falla el cierre", async () => {
    render(<MenuUsuario usuario={usuario} alCerrarSesion={vi.fn().mockRejectedValue(new Error("detalle interno"))} />);
    fireEvent.click(screen.getByRole("button", { name: /Menú de usuario/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cerrar la sesión. Intenta nuevamente.");
    expect(screen.queryByText("detalle interno")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeEnabled();
  });
});
