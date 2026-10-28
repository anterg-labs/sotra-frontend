import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { BotonCerrarSesion } from "./boton-cerrar-sesion";

const cerrarSesion = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/servicio-sesion", () => ({ cerrarSesion }));

beforeEach(() => cerrarSesion.mockReset());

it("cierra la sesión desde Configuración y permite reintentar si falla", async () => {
  cerrarSesion.mockRejectedValueOnce(new Error("Fallo de red")).mockResolvedValueOnce(undefined);
  render(<BotonCerrarSesion />);
  fireEvent.click(screen.getByRole("button", { name: /Cerrar sesión/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cerrar la sesión");
  fireEvent.click(screen.getByRole("button", { name: /Cerrar sesión/ }));
  await waitFor(() => expect(cerrarSesion).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
