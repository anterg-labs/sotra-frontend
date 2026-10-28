import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BotonCancelarFormulario, EsqueletoFormulario, ModalDeRuta, useModalDeRuta, useSalidaDeFormulario } from "./modal-de-ruta";

const volver = vi.hoisted(() => vi.fn());
const empujar = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/clientes/3/editar",
  useSelectedLayoutSegment: () => "editar",
  useRouter: () => ({ back: volver, push: empujar }),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  volver.mockReset();
  empujar.mockReset();
});

function Terminar(props: { ruta: string }) {
  const { terminar, estaEnModal } = useSalidaDeFormulario();
  return (
    <button onClick={() => terminar(props.ruta)} type="button">
      {estaEnModal ? "Guardar en modal" : "Guardar en página"}
    </button>
  );
}

function Indicador() {
  return <span>{useModalDeRuta() ? "en modal" : "en página"}</span>;
}

describe("ModalDeRuta", () => {
  it("no vuelve al listado al pulsar el fondo o Escape", () => {
    render(<ModalDeRuta titulo="Modificar cliente"><input aria-label="Nombre" defaultValue="ACME" /></ModalDeRuta>);
    const dialogo = screen.getByRole("dialog", { name: "Modificar cliente" });
    fireEvent.click(dialogo);
    fireEvent(dialogo, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(volver).not.toHaveBeenCalled();
    expect(dialogo).toHaveAttribute("open");
    expect(screen.getByLabelText("Nombre")).toHaveValue("ACME");
  });
  it("muestra el título y la descripción, y cerrar vuelve a la pantalla anterior", () => {
    render(
      <ModalDeRuta descripcion="Gestión de clientes" titulo="Modificar cliente">
        <input aria-label="Nombre" />
      </ModalDeRuta>,
    );

    expect(screen.getByRole("dialog", { name: "Modificar cliente" })).toBeInTheDocument();
    expect(screen.getByText("Gestión de clientes")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(volver).toHaveBeenCalledOnce();
    expect(empujar).not.toHaveBeenCalled();
  });

  it("el tamaño amplio agrega su clase y el foco va al primer campo, no al botón de cerrar", () => {
    render(
      <ModalDeRuta tamano="amplio" titulo="Crear orden de trabajo">
        <input aria-label="Cliente" />
      </ModalDeRuta>,
    );

    expect(screen.getByRole("dialog", { name: "Crear orden de trabajo" })).toHaveClass("modal-dialogo-amplio");
    expect(screen.getByLabelText("Cliente")).toHaveFocus();
  });

  it("si lo escrito se pierde al cerrar, pide confirmar antes de volver", () => {
    render(
      <ModalDeRuta titulo="Modificar cliente">
        <input aria-label="Nombre" />
      </ModalDeRuta>,
    );

    fireEvent.input(screen.getByLabelText("Nombre"), { target: { value: "ACME" } });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(screen.getByRole("alertdialog", { name: "¿Descartar los cambios?" })).toBeInTheDocument();
    expect(volver).not.toHaveBeenCalled();
  });

  it("los formularios saben que están en un modal: terminar vuelve atrás y «Cancelar» cierra", () => {
    render(
      <ModalDeRuta titulo="Modificar cliente">
        <Indicador />
        <Terminar ruta="/clientes" />
        <BotonCancelarFormulario href="/clientes" />
      </ModalDeRuta>,
    );

    expect(screen.getByText("en modal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar en modal" }));
    expect(volver).toHaveBeenCalledTimes(1);
    expect(empujar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(volver).toHaveBeenCalledTimes(2);
  });
});

describe("fuera de un modal de ruta (página completa)", () => {
  it("terminar va a la ruta indicada y «Cancelar» es un enlace que además ejecuta su acción", () => {
    const alHacerClic = vi.fn();
    render(
      <>
        <Indicador />
        <Terminar ruta="/clientes" />
        <BotonCancelarFormulario alHacerClic={alHacerClic} href="/clientes" />
      </>,
    );

    expect(screen.getByText("en página")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar en página" }));
    expect(empujar).toHaveBeenCalledWith("/clientes");
    const cancelar = screen.getByRole("link", { name: "Cancelar" });
    expect(cancelar).toHaveAttribute("href", "/clientes");
    fireEvent.click(cancelar);
    expect(alHacerClic).toHaveBeenCalledOnce();
    expect(volver).not.toHaveBeenCalled();
  });
});

describe("EsqueletoFormulario", () => {
  it("avisa a los lectores de pantalla que se está cargando", () => {
    render(<EsqueletoFormulario />);
    expect(screen.getByRole("status", { name: "Cargando formulario" })).toHaveAttribute("aria-busy", "true");
  });
});
