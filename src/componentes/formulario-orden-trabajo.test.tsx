import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormularioOrdenTrabajo } from "./formulario-orden-trabajo";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/componentes/sugerencias-orden-trabajo", () => ({ SugerenciasOrdenTrabajo: () => null }));
vi.mock("@/servicios/servicio-ordenes-trabajo", async (importarOriginal) => ({
  ...await importarOriginal<typeof import("@/servicios/servicio-ordenes-trabajo")>(),
  borrarSugerenciasTemporales: vi.fn(),
  crearSesionDeSugerencias: () => "sesion-local",
  estadoNecesitaMotivo: () => false,
  leerSugerenciasTemporales: () => null,
}));

describe("formulario de orden de trabajo", () => {
  it("enfoca y anuncia el cliente obligatorio al guardar", () => {
    const alEnviar = vi.fn();
    render(<FormularioOrdenTrabajo activos={[]} alEnviar={alEnviar} clientes={[]} etiquetaConfirmacion="Crear orden" repuestos={[]} tecnicos={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear orden" }));

    expect(screen.getByRole("combobox", { name: "Cliente" })).toHaveFocus();
    expect(screen.getByText("El cliente es obligatorio.")).toHaveAttribute("role", "alert");
    expect(alEnviar).not.toHaveBeenCalled();
  });

  it("no ofrece crear un cliente desde la orden: se elige uno ya registrado", () => {
    render(<FormularioOrdenTrabajo activos={[]} alEnviar={vi.fn()} clientes={[]} etiquetaConfirmacion="Crear orden" repuestos={[]} tecnicos={[]} />);
    expect(screen.queryByRole("button", { name: "Nuevo cliente" })).toBeNull();
  });
});
