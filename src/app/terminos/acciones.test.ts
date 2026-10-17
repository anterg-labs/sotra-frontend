import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { aceptarTerminosAccion, obtenerTerminosVigentesAccion } from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({ aceptarTerminosServidor: vi.fn(), obtenerTerminosVigentesServidor: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/terminos", () => s);

const estado = { vigente: { id: 4, version: 2 }, pendiente: false, versionAceptada: 2, aceptadoEn: "2026-10-17T12:00:00Z" };

beforeEach(() => {
  s.aceptarTerminosServidor.mockReset();
  s.obtenerTerminosVigentesServidor.mockReset();
  revalidatePath.mockReset();
});

describe("acción de aceptar términos y condiciones", () => {
  it("registra la aceptación y revalida la pantalla y el detalle de usuarios", async () => {
    s.aceptarTerminosServidor.mockResolvedValue(estado);
    await expect(aceptarTerminosAccion(7, 4, true, 2)).resolves.toEqual({ exito: true, registro: estado });
    expect(s.aceptarTerminosServidor).toHaveBeenCalledWith({ usuarioId: 7, terminosId: 4, version: 2, acepta: true });
    expect(revalidatePath).not.toHaveBeenCalledWith("/terminos");
    expect(revalidatePath).toHaveBeenCalledWith("/usuarios", "layout");
  });

  it("sin la casilla marcada no llama a la API y devuelve el error del campo", async () => {
    await expect(aceptarTerminosAccion(7, 4, false, 2)).resolves.toMatchObject({ exito: false, errores: { aceptacion: expect.any(String) } });
    expect(s.aceptarTerminosServidor).not.toHaveBeenCalled();
  });

  it.each([[0, 4], [7, -1], [1.5, 4], ["7", 4]])("rechaza ids inválidos (%s, %s)", async (usuarioId, terminosId) => {
    await expect(aceptarTerminosAccion(usuarioId as never, terminosId as never, true, 2)).resolves.toMatchObject({ exito: false, mensaje: expect.any(String) });
    expect(s.aceptarTerminosServidor).not.toHaveBeenCalled();
  });

  it("ante TERMINOS_DESACTUALIZADOS avisa con claridad y recarga la versión vigente", async () => {
    s.aceptarTerminosServidor.mockRejectedValue(new ErrorDeApi("Desactualizados.", "TERMINOS_DESACTUALIZADOS", 409));
    const resultado = await aceptarTerminosAccion(7, 4, true, 2);
    expect(resultado).toMatchObject({ exito: false, errores: {}, mensaje: expect.stringContaining("cambiaron") });
    expect(revalidatePath).not.toHaveBeenCalledWith("/terminos");
  });

  it("mapea ACEPTACION_OBLIGATORIA al campo y devuelve el mensaje de otros errores de la API", async () => {
    s.aceptarTerminosServidor.mockRejectedValueOnce(new ErrorDeApi("Falta aceptar.", "ACEPTACION_OBLIGATORIA", 400));
    await expect(aceptarTerminosAccion(7, 4, true, 2)).resolves.toEqual({ exito: false, errores: { aceptacion: "Falta aceptar." }, mensaje: "" });
    s.aceptarTerminosServidor.mockRejectedValueOnce(new ErrorDeApi("La persona usuaria no existe.", "USUARIO_INEXISTENTE", 404));
    await expect(aceptarTerminosAccion(7, 4, true, 2)).resolves.toEqual({ exito: false, errores: {}, mensaje: "La persona usuaria no existe." });
    s.aceptarTerminosServidor.mockRejectedValueOnce(new Error("caída"));
    await expect(aceptarTerminosAccion(7, 4, true, 2)).resolves.toMatchObject({ exito: false, mensaje: expect.stringContaining("No se pudo registrar") });
  });
});

describe("acción de obtener los términos vigentes (modal del pie)", () => {
  it("devuelve la versión vigente", async () => {
    s.obtenerTerminosVigentesServidor.mockResolvedValue({ id: 4 });
    await expect(obtenerTerminosVigentesAccion()).resolves.toEqual({ estado: "listo", terminos: { id: 4 } });
  });

  it("un 404 es «vacío» y cualquier otro fallo es «error», sin lanzar", async () => {
    s.obtenerTerminosVigentesServidor.mockRejectedValueOnce(new ErrorDeApi("No hay.", "TERMINOS_INEXISTENTES", 404));
    await expect(obtenerTerminosVigentesAccion()).resolves.toEqual({ estado: "vacio" });
    s.obtenerTerminosVigentesServidor.mockRejectedValueOnce(new ErrorDeApi("Caída.", "API_NO_DISPONIBLE", 503));
    await expect(obtenerTerminosVigentesAccion()).resolves.toEqual({ estado: "error" });
    s.obtenerTerminosVigentesServidor.mockRejectedValueOnce(new Error("x"));
    await expect(obtenerTerminosVigentesAccion()).resolves.toEqual({ estado: "error" });
  });
});
