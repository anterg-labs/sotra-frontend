import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProveedorDeAvisos, useAvisos, type TipoAviso } from "./avisos";

function Disparador(props: { tipo: TipoAviso }) {
  const { mostrarAviso } = useAvisos();
  return <button onClick={() => mostrarAviso(props.tipo, "Listo")} type="button">disparar</button>;
}

function disparar(tipo: TipoAviso) {
  render(<ProveedorDeAvisos><Disparador tipo={tipo} /></ProveedorDeAvisos>);
  fireEvent.click(screen.getByRole("button", { name: "disparar" }));
  return screen.getByText("Listo").closest(".aviso");
}

describe("avisos", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["exito", "aviso-exito"],
    ["error", "aviso-error"],
    ["advertencia", "aviso-advertencia"],
    ["info", "aviso-info"],
  ] as const)("el aviso «%s» va arriba a la derecha con su color (%s)", (tipo, clase) => {
    const aviso = disparar(tipo);

    expect(aviso).toHaveClass("aviso", clase);
    expect(aviso?.parentElement).toHaveClass("avisos-contenedor");
  });

  it("solo el error se anuncia como alerta; los demás van en la región de estado", () => {
    disparar("exito");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Listo");
  });

  it("el error se anuncia como alerta", () => {
    disparar("error");
    expect(screen.getByRole("alert")).toHaveClass("aviso-error");
  });

  it("se cierra solo a los 5 segundos y también con la cruz", () => {
    vi.useFakeTimers();
    render(<ProveedorDeAvisos><Disparador tipo="exito" /></ProveedorDeAvisos>);
    fireEvent.click(screen.getByRole("button", { name: "disparar" }));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText("Listo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "disparar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
    expect(screen.queryByText("Listo")).not.toBeInTheDocument();
  });

  it("un error queda más tiempo en pantalla (8 segundos)", () => {
    vi.useFakeTimers();
    render(<ProveedorDeAvisos><Disparador tipo="error" /></ProveedorDeAvisos>);
    fireEvent.click(screen.getByRole("button", { name: "disparar" }));
    act(() => vi.advanceTimersByTime(7999));
    expect(screen.getByText("Listo")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Listo")).not.toBeInTheDocument();
  });
});
