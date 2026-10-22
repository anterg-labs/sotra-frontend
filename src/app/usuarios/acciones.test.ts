import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { actualizarUsuarioAccion, cambiarEstadoUsuarioAccion, crearUsuarioAccion, restablecerContrasenaAccion } from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  crearUsuarioServidor: vi.fn(),
  actualizarUsuarioServidor: vi.fn(),
  cambiarEstadoUsuarioServidor: vi.fn(),
  restablecerContrasenaServidor: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/usuarios", () => s);

const datos = { nombre: "Ana", apellido: "Pérez", correo: "ana@sotra.com", telefono: "099111222", idsRol: [1, 2] };
const guardado = { id: 7, ...datos, roles: [], estado: "activo", fechaIngreso: "2026-01-01" };

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  revalidatePath.mockReset();
});

describe("acciones de alta y modificación de usuarios", () => {
  it("crea el usuario, revalida el listado y devuelve el registro", async () => {
    s.crearUsuarioServidor.mockResolvedValue(guardado);
    await expect(crearUsuarioAccion(datos)).resolves.toEqual({ exito: true, registro: guardado });
    expect(s.crearUsuarioServidor).toHaveBeenCalledWith(datos);
    expect(revalidatePath).toHaveBeenCalledWith("/usuarios", "layout");
  });

  it("valida en el servidor sin llamar a la API", async () => {
    const resultado = await crearUsuarioAccion({ ...datos, nombre: " ", telefono: "abc" });
    expect(resultado).toMatchObject({ exito: false, errores: { nombre: expect.any(String), telefono: expect.any(String) } });
    expect(s.crearUsuarioServidor).not.toHaveBeenCalled();
  });

  it("exige al menos un rol", async () => {
    await expect(crearUsuarioAccion({ ...datos, idsRol: [] })).resolves.toEqual({
      exito: false, errores: {}, mensaje: "Debe seleccionar al menos un rol.",
    });
    expect(s.crearUsuarioServidor).not.toHaveBeenCalled();
  });

  it("rechaza entradas con forma inválida", async () => {
    await expect(crearUsuarioAccion({ ...datos, idsRol: ["1"] } as never)).resolves.toMatchObject({ exito: false });
    await expect(crearUsuarioAccion({ ...datos, nombre: 5 } as never)).resolves.toMatchObject({ exito: false });
    await expect(crearUsuarioAccion(null as never)).resolves.toMatchObject({ exito: false });
    expect(s.crearUsuarioServidor).not.toHaveBeenCalled();
  });

  it.each([
    ["TELEFONO_DUPLICADO", "telefono"],
    ["CORREO_DUPLICADO", "correo"],
  ])("mapea %s al campo %s", async (codigo, campo) => {
    s.crearUsuarioServidor.mockRejectedValue(new ErrorDeApi("Ya está registrado.", codigo, 409));
    await expect(crearUsuarioAccion(datos)).resolves.toEqual({ exito: false, errores: { [campo]: "Ya está registrado." }, mensaje: "" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("devuelve mensajes generales ante otros errores", async () => {
    s.crearUsuarioServidor.mockRejectedValueOnce(new ErrorDeApi("No se pudo crear el usuario.", null, 500));
    await expect(crearUsuarioAccion(datos)).resolves.toMatchObject({ mensaje: "No se pudo crear el usuario." });
    s.crearUsuarioServidor.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(crearUsuarioAccion(datos)).resolves.toMatchObject({ mensaje: "No se pudo guardar la información del usuario." });
  });

  it("modifica conservando el estado y la fecha de ingreso, sin exigir contraseña", async () => {
    s.actualizarUsuarioServidor.mockResolvedValue(guardado);
    await expect(actualizarUsuarioAccion(7, "activo", "2026-02-03", datos)).resolves.toMatchObject({ exito: true });
    expect(s.actualizarUsuarioServidor).toHaveBeenCalledWith(7, {
      nombre: "Ana", apellido: "Pérez", correo: "ana@sotra.com", telefono: "099111222", idsRol: [1, 2],
      estado: "activo", fechaIngreso: "2026-02-03",
    });
    await expect(actualizarUsuarioAccion(7, "borrado" as never, "2026-02-03", datos)).resolves.toMatchObject({ exito: false });
  });
});

describe("acción de baja de usuarios", () => {
  it("cambia el estado y revalida", async () => {
    s.cambiarEstadoUsuarioServidor.mockResolvedValue(guardado);
    await expect(cambiarEstadoUsuarioAccion(7, "inactivo")).resolves.toEqual({ exito: true });
    expect(s.cambiarEstadoUsuarioServidor).toHaveBeenCalledWith(7, "inactivo");
    expect(revalidatePath).toHaveBeenCalledWith("/usuarios", "layout");
  });

  it("informa el error y rechaza argumentos inválidos", async () => {
    s.cambiarEstadoUsuarioServidor.mockRejectedValue(new Error("boom"));
    await expect(cambiarEstadoUsuarioAccion(7, "inactivo")).resolves.toEqual({
      exito: false, mensaje: "No se pudo desactivar el usuario seleccionado.",
    });
    await expect(cambiarEstadoUsuarioAccion(0, "inactivo")).resolves.toMatchObject({ exito: false });
    expect(s.cambiarEstadoUsuarioServidor).toHaveBeenCalledTimes(1);
  });
});

describe("restablecer contraseña", () => {
  it("con 204 informa el éxito", async () => {
    s.restablecerContrasenaServidor.mockResolvedValue(undefined);
    await expect(restablecerContrasenaAccion(7)).resolves.toEqual({ exito: true });
    expect(s.restablecerContrasenaServidor).toHaveBeenCalledWith(7);
  });

  it.each([
    [409, "USUARIO_SIN_ACCESO", "El usuario no tiene acceso al sistema: no está registrado en Keycloak."],
    [409, "USUARIO_INACTIVO", "El usuario está dado de baja."],
    [502, "KEYCLOAK_NO_DISPONIBLE", "No se pudo conectar con Keycloak."],
  ])("con %i %s muestra el mensaje de la API", async (estado, codigo, mensaje) => {
    s.restablecerContrasenaServidor.mockRejectedValue(new ErrorDeApi(mensaje, codigo, estado));
    await expect(restablecerContrasenaAccion(25)).resolves.toEqual({ exito: false, mensaje });
  });

  it("no llama a la API con un id inválido", async () => {
    await expect(restablecerContrasenaAccion(0)).resolves.toMatchObject({ exito: false });
    expect(s.restablecerContrasenaServidor).not.toHaveBeenCalled();
  });
});
