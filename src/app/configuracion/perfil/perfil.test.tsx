import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioPerfil } from "@/componentes/formulario-perfil";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { permisoDeRuta } from "@/seguridad/permisos";
import type { Usuario } from "@/tipos/usuario";

const s = vi.hoisted(() => ({ actualizarPerfilServidor: vi.fn(), mostrarAviso: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn(), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/servicios/servidor/perfil", () => ({ actualizarPerfilServidor: s.actualizarPerfilServidor }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: s.mostrarAviso }) }));

const { actualizarPerfilAccion } = await import("./acciones");

const usuario = {
  id: 3, nombre: "Ana", apellido: "Pérez", correo: "ana@sotra.test", telefono: "099123456", estado: "activo",
  fechaIngreso: "2026-01-01", cantidadOrdenesAsignadas: 0, roles: [],
} as Usuario;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("actualizarPerfilAccion", () => {
  it("envía solo nombre, apellido y teléfono, sin correo ni roles", async () => {
    s.actualizarPerfilServidor.mockResolvedValue(usuario);
    const resultado = await actualizarPerfilAccion({ nombre: "Ana", apellido: "Pérez", telefono: "099123456", correo: "otro@x.com", idsRol: [1] });
    expect(resultado.exito).toBe(true);
    expect(s.actualizarPerfilServidor).toHaveBeenCalledWith({ nombre: "Ana", apellido: "Pérez", telefono: "099123456" });
  });

  it("rechaza entradas inválidas antes de llamar a la API", async () => {
    expect(await actualizarPerfilAccion(null)).toMatchObject({ exito: false });
    expect(await actualizarPerfilAccion({ nombre: "", apellido: "Pérez", telefono: "abc" })).toMatchObject({
      exito: false,
      errores: { nombre: expect.any(String), telefono: expect.any(String) },
    });
    expect(s.actualizarPerfilServidor).not.toHaveBeenCalled();
  });

  it("muestra un teléfono duplicado junto al campo", async () => {
    s.actualizarPerfilServidor.mockRejectedValue(new ErrorDeApi("El teléfono ya está registrado.", "TELEFONO_DUPLICADO", 409));
    expect(await actualizarPerfilAccion({ nombre: "Ana", apellido: "Pérez", telefono: "099123456" })).toMatchObject({
      exito: false,
      errores: { telefono: "El teléfono ya está registrado." },
    });
  });
});

describe("FormularioPerfil", () => {
  it("precarga los datos, guarda y avisa; correo y contraseña quedan bloqueados con el aviso de Keycloak", async () => {
    const accion = vi.fn(async () => ({ exito: true as const, registro: usuario }));
    render(<FormularioPerfil accion={accion} perfil={usuario} />);

    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana");
    expect(screen.getByLabelText("Correo electrónico")).toBeDisabled();
    expect(screen.getByLabelText("Contraseña")).toBeDisabled();
    expect(screen.getAllByText(/Depende de la integración con Keycloak/)).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana María" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(accion).toHaveBeenCalledWith({ nombre: "Ana María", apellido: "Pérez", telefono: "099123456" }));
    await waitFor(() => expect(s.mostrarAviso).toHaveBeenCalledWith("exito", "Perfil actualizado."));
  });

  it("muestra los errores de validación sin llamar a la acción", async () => {
    const accion = vi.fn();
    render(<FormularioPerfil accion={accion} perfil={usuario} />);
    fireEvent.change(screen.getByLabelText("Número de teléfono o celular"), { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
    expect(accion).not.toHaveBeenCalled();
  });
});

describe("permisos de las rutas de configuración", () => {
  it("el panel y Mi perfil son para cualquier persona con sesión; Términos exige permiso", () => {
    expect(permisoDeRuta("/configuracion")).toBeNull();
    expect(permisoDeRuta("/configuracion/perfil")).toBeNull();
    expect(permisoDeRuta("/configuracion/terminos")).toBe("configuracion.gestionar");
  });
});
