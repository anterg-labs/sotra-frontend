import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { BotonTerminos, EVENTO_TERMINOS_PUBLICADOS } from "./modal-terminos";
import { CLAVE_ACEPTACION_TERMINOS, guardarAceptacion } from "@/utilidades/aceptacion-terminos";

const obtenerTerminosVigentesAccion = vi.hoisted(() => vi.fn());
vi.mock("@/app/terminos/acciones", () => ({ obtenerTerminosVigentesAccion }));

const terminos = { id: 4, version: 2, titulo: "Términos de SOTRA", texto: "Texto con **formato**.", datosAlmacenados: ["Nombre", "Correo"], vigente: true, creadoEn: "2026-10-17T12:00:00Z" };
const vigente = { estado: "listo", terminos };
const abrir = () => fireEvent.click(screen.getByRole("button", { name: "Términos y condiciones" }));
const montarYabrir = () => { const vista = render(<BotonTerminos />); abrir(); return vista; };
const marcar = () => fireEvent.click(screen.getByRole("checkbox"));

it("ofrece la lectura manual de términos como tarjeta de Configuración", async () => {
  obtenerTerminosVigentesAccion.mockResolvedValue({ estado: "vacio" });
  render(<BotonTerminos presentacion="tarjeta" />);
  const boton = screen.getByRole("button", { name: /Leer términos y condiciones/ });
  expect(boton).toHaveClass("opcion-configuracion");
  fireEvent.click(boton);
  expect(await screen.findByText("Todavía no hay términos publicados.")).toBeInTheDocument();
});
async function leer() {
  const region = await screen.findByRole("region", { name: "Texto de los términos y condiciones" });
  fireEvent.scroll(region, { target: { scrollTop: 400 } });
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeEnabled());
}
async function aceptar() {
  await leer();
  marcar();
  fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

// El modal carga la lectura con `next/dynamic`: se precarga una vez para que la primera prueba que abre el diálogo
// no pague la transformación del módulo (con la suite completa en paralelo superaba los 5 s).
beforeAll(async () => {
  await import("./lectura-terminos");
}, 30_000);

beforeEach(() => {
  window.localStorage.clear();
  obtenerTerminosVigentesAccion.mockReset().mockResolvedValue(vigente);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(600);
});
afterEach(() => vi.restoreAllMocks());

describe("aceptación y consulta manual de términos en el modal", () => {
  it("no solicita ni abre términos al montar, recuperar el foco o publicar cambios", async () => {
    render(<BotonTerminos />);
    await act(async () => { window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event(EVENTO_TERMINOS_PUBLICADOS)); });
    expect(obtenerTerminosVigentesAccion).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("se abre desde el footer y conserva la lectura y aceptación pendientes", async () => {
    montarYabrir();
    expect(await screen.findByText(/Texto con/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await leer();
    expect(screen.getByRole("checkbox")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeDisabled();
    marcar();
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(JSON.parse(window.localStorage.getItem(CLAVE_ACEPTACION_TERMINOS)!)).toMatchObject({ terminosId: 4, version: 2 });
  });

  it("una aceptación vigente persiste al remontar y el footer permite consultar sin aceptar otra vez", async () => {
    const { unmount } = montarYabrir();
    await aceptar();
    unmount();
    render(<BotonTerminos />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    abrir();
    expect(await screen.findByText(/Texto con/)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aceptar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Aceptar los términos" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("publicar cambios no consulta ni abre; al pulsar el footer pide aceptar el documento nuevo", async () => {
    montarYabrir();
    await aceptar();
    const consultas = obtenerTerminosVigentesAccion.mock.calls.length;
    obtenerTerminosVigentesAccion.mockResolvedValue({ estado: "listo", terminos: { ...terminos, texto: "Texto actualizado de los términos.", version: 3 } });
    act(() => window.dispatchEvent(new Event(EVENTO_TERMINOS_PUBLICADOS)));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(obtenerTerminosVigentesAccion).toHaveBeenCalledTimes(consultas);
    abrir();
    expect(await screen.findByText("Texto actualizado de los términos.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("verifica la versión antes de guardar y no acepta una que cambió durante la lectura", async () => {
    montarYabrir();
    await leer();
    marcar();
    obtenerTerminosVigentesAccion.mockResolvedValue({ estado: "listo", terminos: { ...terminos, texto: "Texto actualizado de los términos.", version: 3 } });
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    await screen.findByText("Texto actualizado de los términos.");
    expect(window.localStorage.getItem(CLAVE_ACEPTACION_TERMINOS)).toBeNull();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("no consulta al recuperar el foco y conserva la sincronización de aceptación entre pestañas", async () => {
    montarYabrir();
    await screen.findByRole("checkbox");
    const consultas = obtenerTerminosVigentesAccion.mock.calls.length;
    act(() => guardarAceptacion({ terminosId: 4, version: 2, aceptadoEn: new Date().toISOString() }));
    await waitFor(() => expect(screen.queryByRole("checkbox")).not.toBeInTheDocument());
    fireEvent(window, new Event("focus"));
    expect(obtenerTerminosVigentesAccion).toHaveBeenCalledTimes(consultas);
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  it("una aceptación corrupta o de otra versión vuelve a pedirse", async () => {
    window.localStorage.setItem(CLAVE_ACEPTACION_TERMINOS, "{roto");
    montarYabrir();
    expect(await screen.findByRole("checkbox")).not.toBeChecked();
  });

  it("si no puede guardar, informa el error y mantiene la aceptación pendiente", async () => {
    montarYabrir();
    await leer();
    marcar();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("bloqueado"); });
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar la aceptación");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("un error de API permite reintentar sin saltarse la aceptación", async () => {
    obtenerTerminosVigentesAccion.mockRejectedValueOnce(new Error("red"));
    montarYabrir();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron obtener");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("checkbox")).toBeInTheDocument();
  });

  it("sin términos publicados permite seguir y el footer muestra el estado vacío", async () => {
    obtenerTerminosVigentesAccion.mockResolvedValue({ estado: "vacio" });
    render(<BotonTerminos />);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    abrir();
    expect(await screen.findByText("Todavía no hay términos publicados.")).toBeInTheDocument();
  });
});
