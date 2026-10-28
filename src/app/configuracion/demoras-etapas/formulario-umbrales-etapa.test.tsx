import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioUmbralesEtapa } from "./formulario-umbrales-etapa";

const api = vi.hoisted(() => ({ apiObtenerUmbralesEtapa: vi.fn(), apiGuardarUmbralEtapa: vi.fn() }));
vi.mock("@/servicios/api/api-demoras-etapas", () => api);
beforeEach(() => { Object.values(api).forEach(fn => fn.mockReset()); api.apiObtenerUmbralesEtapa.mockResolvedValue([{ etapa: "pendiente", umbralHoras: null }]); });
describe("umbrales por etapa", () => {
  it("guarda fracciones, cero y null para volver al promedio histórico", async () => {
    render(<FormularioUmbralesEtapa />);
    const entrada = await screen.findByLabelText("Umbral en horas — Pendiente");
    for (const [texto, valor] of [["1,5", 1.5], ["0", 0], ["", null]] as const) {
      api.apiGuardarUmbralEtapa.mockResolvedValue({ etapa: "pendiente", umbralHoras: valor });
      fireEvent.change(entrada, { target: { value: texto } });
      fireEvent.submit(screen.getByRole("form", { name: "Pendiente" }));
      await screen.findByRole("status");
      expect(api.apiGuardarUmbralEtapa).toHaveBeenLastCalledWith("pendiente", valor);
    }
    expect(screen.getByRole("status")).toHaveTextContent("promedio histórico");
  });
  it("rechaza valores negativos y enfoca el campo sin enviar una solicitud", async () => {
    render(<FormularioUmbralesEtapa />);
    const entrada = await screen.findByLabelText("Umbral en horas — Pendiente");
    fireEvent.change(entrada, { target: { value: "-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no negativo");
    expect(entrada).toHaveFocus();
    expect(api.apiGuardarUmbralEtapa).not.toHaveBeenCalled();
  });
  it("muestra un rechazo del servidor junto al formulario", async () => {
    api.apiGuardarUmbralEtapa.mockRejectedValue(new Error("No se pudo guardar el umbral."));
    render(<FormularioUmbralesEtapa />);
    const formulario = await screen.findByRole("form", { name: "Pendiente" });
    fireEvent.click(within(formulario).getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar el umbral.");
  });
});
