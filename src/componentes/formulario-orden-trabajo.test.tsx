import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Cliente } from "@/tipos/cliente";
import { FormularioOrdenTrabajo } from "./formulario-orden-trabajo";

const clienteCreado: Cliente = {
  id: 7,
  razonSocial: "Cliente nuevo",
  nombreContacto: "Ana Pérez",
  correo: null,
  telefono: null,
  direccion: null,
  observaciones: null,
  cantidadActivosAsociados: 0,
  cantidadOrdenesAsociadas: 0,
  estado: "activo",
  creadoEn: "2026-10-16T00:00:00Z",
};

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/componentes/modal", () => ({
  Modal: ({ children, estaAbierto }: { children: React.ReactNode; estaAbierto: boolean }) =>
    estaAbierto ? <div>{children}</div> : null,
}));
vi.mock("@/componentes/formulario-cliente", () => ({
  FormularioCliente: ({ alGuardar }: { alGuardar: (cliente: Cliente) => void }) => (
    <button onClick={() => alGuardar(clienteCreado)} type="button">Simular registro cliente</button>
  ),
}));
vi.mock("@/componentes/sugerencias-orden-trabajo", () => ({ SugerenciasOrdenTrabajo: () => null }));
vi.mock("@/servicios/servicio-ordenes-trabajo", async (importarOriginal) => ({
  ...await importarOriginal<typeof import("@/servicios/servicio-ordenes-trabajo")>(),
  borrarSugerenciasTemporales: vi.fn(),
  crearSesionDeSugerencias: () => "sesion-local",
  estadoNecesitaMotivo: () => false,
  leerSugerenciasTemporales: () => null,
}));

describe("alta rápida de cliente en una orden", () => {
  it("enfoca y anuncia el cliente obligatorio al guardar", () => {
    const alEnviar = vi.fn();
    render(<FormularioOrdenTrabajo activos={[]} alEnviar={alEnviar} clientes={[]} etiquetaConfirmacion="Crear orden" repuestos={[]} tecnicos={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Crear orden" }));

    expect(screen.getByRole("combobox", { name: "Cliente" })).toHaveFocus();
    expect(screen.getByText("El cliente es obligatorio.")).toHaveAttribute("role", "alert");
    expect(alEnviar).not.toHaveBeenCalled();
  });

  it("agrega y selecciona el cliente sin salir del formulario", () => {
    render(
      <FormularioOrdenTrabajo
        activos={[]}
        alEnviar={vi.fn()}
        clientes={[]}
        etiquetaConfirmacion="Crear orden"
        repuestos={[]}
        tecnicos={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nuevo cliente" }));
    fireEvent.click(screen.getByRole("button", { name: "Simular registro cliente" }));

    expect(screen.getByRole("combobox", { name: "Cliente" })).toHaveValue("Cliente nuevo");
    expect(screen.queryByRole("button", { name: "Simular registro cliente" })).toBeNull();
  });
});
