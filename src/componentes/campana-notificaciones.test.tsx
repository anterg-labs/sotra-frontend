import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Notificacion } from "@/tipos/notificacion";
import { CampanaNotificaciones } from "./campana-notificaciones";

const servicio = vi.hoisted(() => ({
  contarNotificacionesNoLeidas: vi.fn(),
  listarNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasLasNotificacionesLeidas: vi.fn(),
}));
vi.mock("@/servicios/servicio-notificaciones", () => servicio);

function aviso(id: number, leida = false, ordenId: number | null = id + 100): Notificacion {
  return { id, tipo: "orden_asignada", mensaje: `Se te asignó la orden #${ordenId}.`, ordenId, creadaEn: "2026-10-28T15:00:00Z", leida };
}

const rutaDeLaOrden = (ordenId: number) => "/ordenes-trabajo/" + ordenId;

describe("campana de notificaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    servicio.contarNotificacionesNoLeidas.mockResolvedValue(2);
    servicio.listarNotificaciones.mockResolvedValue([aviso(1), aviso(2), aviso(3, true)]);
    servicio.marcarNotificacionLeida.mockResolvedValue(undefined);
    servicio.marcarTodasLasNotificacionesLeidas.mockResolvedValue(undefined);
  });

  it("muestra cuántas notificaciones hay sin leer y lo anuncia en el nombre del botón", async () => {
    render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);

    expect(await screen.findByRole("button", { name: "Notificaciones: 2 sin leer" })).toBeInTheDocument();
  });

  it("sin avisos pendientes no muestra contador", async () => {
    servicio.contarNotificacionesNoLeidas.mockResolvedValue(0);
    render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);

    await waitFor(() => expect(servicio.contarNotificacionesNoLeidas).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Notificaciones" })).toBeInTheDocument();
  });

  it("al abrirla lista los avisos con enlace a su orden", async () => {
    render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);
    fireEvent.click(await screen.findByRole("button", { name: /Notificaciones/ }));

    const enlace = await screen.findByRole("link", { name: /orden #101/ });
    expect(enlace).toHaveAttribute("href", "/ordenes-trabajo/101");
    expect(servicio.listarNotificaciones).toHaveBeenCalledWith(10);
  });

  it("abrir un aviso sin leer lo marca como leído y baja el contador", async () => {
    render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);
    fireEvent.click(await screen.findByRole("button", { name: /Notificaciones/ }));
    fireEvent.click(await screen.findByRole("link", { name: /orden #101/ }));

    await waitFor(() => expect(servicio.marcarNotificacionLeida).toHaveBeenCalledWith(1));
    expect(screen.getByRole("button", { name: "Notificaciones: 1 sin leer" })).toBeInTheDocument();
  });

  it("abrir un aviso ya leído no vuelve a marcarlo", async () => {
    render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);
    fireEvent.click(await screen.findByRole("button", { name: /Notificaciones/ }));
    fireEvent.click(await screen.findByRole("link", { name: /orden #103/ }));

    expect(servicio.marcarNotificacionLeida).not.toHaveBeenCalled();
  });

  it("marca todas como leídas y deja el contador en cero", async () => {
    render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);
    fireEvent.click(await screen.findByRole("button", { name: /Notificaciones/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Marcar todas como leídas" }));

    await waitFor(() => expect(servicio.marcarTodasLasNotificacionesLeidas).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Notificaciones" })).toBeInTheDocument();
  });

  it("muestra el estado vacío y el error de carga", async () => {
    servicio.listarNotificaciones.mockResolvedValueOnce([]);
    const { unmount } = render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);
    fireEvent.click(await screen.findByRole("button", { name: /Notificaciones/ }));
    expect(await screen.findByText("No tenés notificaciones.")).toBeInTheDocument();
    unmount();

    servicio.listarNotificaciones.mockRejectedValueOnce(new Error("falla"));
    render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);
    fireEvent.click(await screen.findByRole("button", { name: /Notificaciones/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar las notificaciones.");
  });

  it("se cierra con Escape y devuelve el foco al botón", async () => {
    render(<CampanaNotificaciones rutaDeLaOrden={rutaDeLaOrden} />);
    const boton = await screen.findByRole("button", { name: /Notificaciones/ });
    fireEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(boton).toHaveFocus();
  });
});
