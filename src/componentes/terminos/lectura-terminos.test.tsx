import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TerminosCondiciones } from "@/tipos/terminos";
import { LecturaTerminos } from "./lectura-terminos";

const terminos: TerminosCondiciones = { id: 1, version: 1, texto: "Texto largo", vigente: true, creadoEn: "2026-10-27T00:00:00Z" };

describe("LecturaTerminos en pantallas chicas", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("habilita la casilla cuando el final del texto entra en pantalla, aunque se desplace el modal y no el recuadro", () => {
    let alVer: (entradas: { isIntersecting: boolean }[]) => void = () => undefined;
    vi.stubGlobal("IntersectionObserver", class { constructor(callback: typeof alVer) { alVer = callback; } observe() {} disconnect() {} });
    render(<LecturaTerminos alAceptar={async () => undefined} requiereAceptacion terminos={terminos} />);
    expect(screen.getByRole("checkbox")).toBeDisabled();

    act(() => alVer([{ isIntersecting: true }]));

    expect(screen.getByRole("checkbox")).toBeEnabled();
  });
});
