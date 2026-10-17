import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Modal } from "./modal";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => vi.restoreAllMocks());

function dibujar(estaOcupado = false) {
  const alCerrar = vi.fn();
  render(
    <Modal alCerrar={alCerrar} estaAbierto estaOcupado={estaOcupado} titulo="Nuevo">
      <input aria-label="Nombre" />
    </Modal>,
  );
  return alCerrar;
}

describe("Modal", () => {
  it("se nombra con su título, bloquea el scroll de la página y cierra sin confirmar si no hay datos", () => {
    const alCerrar = dibujar();
    expect(screen.getByRole("dialog", { name: "Nuevo" })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(alCerrar).toHaveBeenCalledOnce();
  });

  it("pide confirmar antes de descartar datos escritos", () => {
    const confirmar = vi.spyOn(window, "confirm");
    const alCerrar = dibujar();
    fireEvent.input(screen.getByLabelText("Nombre"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.getByRole("alertdialog", { name: "¿Descartar los cambios?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seguir editando" })).toHaveFocus();
    expect(alCerrar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toHaveValue("x");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.click(screen.getByRole("button", { name: "Descartar cambios" }));
    expect(alCerrar).toHaveBeenCalledOnce();
    expect(confirmar).not.toHaveBeenCalled();
  });

  it("Escape en la confirmación conserva los datos y deja abierto el formulario", () => {
    const alCerrar = dibujar();
    fireEvent.input(screen.getByLabelText("Nombre"), { target: { value: "x" } });
    fireEvent(screen.getByRole("dialog", { name: "Nuevo" }), new Event("cancel", { bubbles: true, cancelable: true }));
    fireEvent(screen.getByRole("alertdialog"), new Event("cancel", { bubbles: true, cancelable: true }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Nuevo" })).toHaveAttribute("open");
    expect(screen.getByLabelText("Nombre")).toHaveValue("x");
    expect(alCerrar).not.toHaveBeenCalled();
  });

  it("clic fuera del aviso vuelve al formulario sin descartar", () => {
    const alCerrar = dibujar();
    fireEvent.input(screen.getByLabelText("Nombre"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("dialog", { name: "Nuevo" }));
    fireEvent.click(screen.getByRole("alertdialog"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(alCerrar).not.toHaveBeenCalled();
  });

  it("no se puede cerrar mientras se guarda", () => {
    const alCerrar = dibujar(true);
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(alCerrar).not.toHaveBeenCalled();
  });
});
