import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SugerenciasOrdenTrabajo } from "./sugerencias-orden-trabajo";

vi.mock("@/servicios/servicio-ordenes-trabajo", () => ({
  guardarSugerenciasTemporales: vi.fn(),
  solicitarSugerenciaOrdenTrabajo: () => Promise.reject(new Error("No hay documentación suficiente para esta tarea.")),
}));

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
