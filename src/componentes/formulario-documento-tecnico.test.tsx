import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormularioDocumentoTecnico } from "./formulario-documento-tecnico";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("errores del formulario de documentación técnica", () => {
  it("muestra la falta de PDF junto al archivo y lo enfoca", async () => {
    const alEnviar = vi.fn();
    render(<FormularioDocumentoTecnico activos={[]} alEnviar={alEnviar} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));

    await waitFor(() => expect(screen.getByText("Seleccioná un archivo PDF.")).toHaveAttribute("id", "archivo-error"));
    expect(screen.getByLabelText("Archivo PDF")).toHaveFocus();
    expect(alEnviar).not.toHaveBeenCalled();
  });
});
