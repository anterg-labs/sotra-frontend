import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BotonDescargarApp } from "./boton-descargar-app";

const generar = vi.hoisted(() => vi.fn());
vi.mock("@/utilidades/codigo-qr", () => ({ generarCodigoQr: generar }));
vi.mock("@/servicios/direccion-app", () => ({ obtenerDireccionParaApp: async (url: string) => url }));
beforeEach(() => {
  generar.mockReset().mockResolvedValue({ lado: 33, trazado: "M4 4h1v1h-1z" });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
  window.history.replaceState(null, "", "/inicio");
});
describe("descargar App", () => {
  it("genera el QR al pulsar y toma nuevamente la URL al reabrir", async () => {
    render(<BotonDescargarApp />);
    expect(generar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Descargar App" }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(generar).toHaveBeenLastCalledWith(window.location.href);
    expect(screen.getByRole("img")).toHaveAttribute("viewBox", "0 0 33 33");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar QR" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    window.history.replaceState(null, "", "/inicio?entorno=actual#app");
    fireEvent.click(screen.getByRole("button", { name: "Descargar App" }));
    await screen.findByRole("dialog");
    expect(generar).toHaveBeenLastCalledWith(window.location.href);
    expect(generar).toHaveBeenCalledTimes(2);
  });
  it("comparte el enlace con el menú del sistema o, si no existe, lo copia", async () => {
    const compartir = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: compartir });
    render(<BotonDescargarApp />);
    fireEvent.click(screen.getByRole("button", { name: "Descargar App" }));
    fireEvent.click(await screen.findByRole("button", { name: "Compartir enlace" }));
    await waitFor(() => expect(compartir).toHaveBeenCalledWith({ title: "SOTRA", url: window.location.href }));

    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    const escribir = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: escribir } });
    fireEvent.click(screen.getByRole("button", { name: "Compartir enlace" }));
    await waitFor(() => expect(escribir).toHaveBeenCalledWith(window.location.href));
    expect(await screen.findByText("Enlace copiado.")).toBeVisible();
  });

  it("ofrece descargar el QR como imagen y avisa si no se puede crear", async () => {
    render(<BotonDescargarApp />);
    fireEvent.click(screen.getByRole("button", { name: "Descargar App" }));
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "Descargar imagen" })).toBeEnabled();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: () => { throw new Error("sin soporte"); } });
    fireEvent.click(screen.getByRole("button", { name: "Descargar imagen" }));
    expect(await screen.findByText("No se pudo crear la imagen del QR.")).toBeVisible();
  });

  it("muestra un error recuperable si falla la generación", async () => {
    generar.mockRejectedValueOnce(new Error("No hay capacidad"));
    render(<BotonDescargarApp />);
    fireEvent.click(screen.getByRole("button", { name: "Descargar App" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Volvé a intentarlo");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Descargar App" })).toBeEnabled();
  });
});
