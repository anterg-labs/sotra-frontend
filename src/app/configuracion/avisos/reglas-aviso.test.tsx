import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReglaAviso } from "@/tipos/reporte";
import { FormularioReglasAviso, validarBorrador } from "./formulario-reglas-aviso";

const api = vi.hoisted(() => ({ apiActualizarReglaAviso: vi.fn() }));
vi.mock("@/servicios/api/api-reportes", () => api);

const regla: ReglaAviso = {
  codigo: "R1", nombre: "Máquina que reincide", activa: true, umbral: 2, umbralCritico: 3, ventanaDias: 180, ventanaCriticaDias: 730, minimoDatos: 1,
};

beforeEach(() => {
  api.apiActualizarReglaAviso.mockReset();
});

describe("reglas de aviso", () => {
  it("valida sin límites fijos: cualquier número vale, pero las ventanas son enteras mayores que cero", () => {
    const base = { activa: true, umbral: "100000", umbralCritico: "", ventanaDias: "", ventanaCriticaDias: "", minimoDatos: "0" };
    expect(validarBorrador(base)).toBe("");
    expect(validarBorrador({ ...base, umbral: "-5" })).toBe("");
    expect(validarBorrador({ ...base, umbral: "" })).toBe("El umbral debe ser un número.");
    expect(validarBorrador({ ...base, umbralCritico: "mucho" })).toBe("El umbral crítico debe ser un número.");
    expect(validarBorrador({ ...base, ventanaDias: "0" })).toBe("La ventana debe ser un número entero de días mayor que cero.");
    expect(validarBorrador({ ...base, ventanaCriticaDias: "1,5" })).toBe("La ventana crítica debe ser un número entero de días mayor que cero.");
    expect(validarBorrador({ ...base, minimoDatos: "-1" })).toBe("El mínimo de datos debe ser un número entero de cero en adelante.");
  });

  it("guarda los cambios de una regla y los muestra confirmados", async () => {
    api.apiActualizarReglaAviso.mockResolvedValue({ ...regla, umbral: 4, activa: false });
    render(<FormularioReglasAviso reglas={[regla]} />);
    fireEvent.click(screen.getByText("Ajustar umbrales y período"));
    fireEvent.change(screen.getByLabelText("Umbral de atención"), { target: { value: "4" } });
    fireEvent.click(screen.getByLabelText("Regla encendida"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(api.apiActualizarReglaAviso).toHaveBeenCalledWith("R1", {
        activa: false, umbral: 4, umbralCritico: 3, ventanaDias: 180, ventanaCriticaDias: 730, minimoDatos: 1,
      }),
    );
    expect(await screen.findByText("Regla guardada.")).toBeInTheDocument();
  });

  it("no envía un borrador inválido y muestra el error del servidor", async () => {
    render(<FormularioReglasAviso reglas={[regla]} />);
    fireEvent.click(screen.getByText("Ajustar umbrales y período"));
    fireEvent.change(screen.getByLabelText("Ventana en días (opcional)"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("La ventana debe ser un número entero de días mayor que cero.");
    expect(api.apiActualizarReglaAviso).not.toHaveBeenCalled();

    api.apiActualizarReglaAviso.mockRejectedValue(new Error("No tenés permiso para realizar esta acción."));
    fireEvent.change(screen.getByLabelText("Ventana en días (opcional)"), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("No tenés permiso para realizar esta acción.")).toBeInTheDocument();
  });

  it("muestra el nombre sin código y explica la utilidad con ayuda accesible", () => {
    render(<FormularioReglasAviso reglas={[regla]} />);
    expect(screen.getByRole("heading", { name: "Máquina que reincide" })).toBeInTheDocument();
    expect(screen.queryByText(/R1 ·/)).not.toBeInTheDocument();
    const boton = screen.getByRole("button", { name: "¿Para qué sirve Máquina que reincide?" });
    expect(boton).toHaveAttribute("aria-describedby", "regla-R1-ayuda");
    expect(screen.getByRole("tooltip")).toHaveTextContent("evitar nuevas paradas");
  });
});
