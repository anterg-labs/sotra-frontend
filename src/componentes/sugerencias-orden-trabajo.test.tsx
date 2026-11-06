import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { solicitarSugerenciaOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import { SugerenciasOrdenTrabajo } from "./sugerencias-orden-trabajo";

vi.mock("@/servicios/servicio-ordenes-trabajo", () => ({
  guardarSugerenciasTemporales: vi.fn(),
  solicitarSugerenciaOrdenTrabajo: vi.fn(() => Promise.reject(new Error("No hay documentación suficiente para esta tarea."))),
}));

describe("etapas de la sugerencia", () => {
  it("muestra cada etapa a medida que la API la informa, y al terminar las oculta", async () => {
    let avanzar: (etapa: string) => void = () => {};
    let terminar: (valor: { texto: string; sinIa: boolean }) => void = () => {};
    vi.mocked(solicitarSugerenciaOrdenTrabajo).mockImplementationOnce((_datos, alAvanzar) => {
      avanzar = alAvanzar ?? avanzar;
      return new Promise((resolver) => { terminar = resolver; });
    });
    render(
      <SugerenciasOrdenTrabajo
        activoId=""
        alCambiarSugerencias={vi.fn()}
        claveSugerenciasTemporales=""
        descripcion="Revisar la máquina"
        sesion="sesion"
        sugerencias={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Solicitar sugerencia" }));
    expect(screen.getByRole("status")).toHaveTextContent("Buscando en la documentación técnica…");

    act(() => { avanzar("buscando"); avanzar("eligiendo"); avanzar("etapa-nueva"); avanzar("redactando"); });
    const items = screen.getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toEqual(["✓Buscando en la documentación técnica", "✓Eligiendo la información más adecuada", "Preparando la sugerencia…"]);

    await act(async () => { terminar({ texto: "Listo", sinIa: false }); });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });
});

describe("errores de sugerencias de órdenes", () => {
  it("anuncia el error junto a la acción de solicitar", async () => {
    render(
      <SugerenciasOrdenTrabajo
        activoId=""
        alCambiarSugerencias={vi.fn()}
        claveSugerenciasTemporales=""
        descripcion="Revisar la máquina"
        sesion="sesion"
        sugerencias={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Solicitar sugerencia" }));
    await waitFor(() => expect(screen.getByText("No hay documentación suficiente para esta tarea.")).toHaveAttribute("role", "alert"));
    expect(screen.getByText("No hay documentación suficiente para esta tarea.").closest(".form-field"))
      .toContainElement(screen.getByRole("button", { name: "Solicitar sugerencia" }));
  });
});
