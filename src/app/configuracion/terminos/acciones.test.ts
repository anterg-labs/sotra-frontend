import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicarTerminosAccion } from "./acciones";

const s = vi.hoisted(() => ({ publicarTerminosServidor: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: s.revalidatePath }));
vi.mock("@/servicios/servidor/terminos", () => ({ publicarTerminosServidor: s.publicarTerminosServidor }));
beforeEach(() => Object.values(s).forEach(f => f.mockReset()));

describe("guardar el texto de términos", () => {
  it("envía solo texto y revalida configuración", async () => {
    const datos = { texto: "Texto completo de los términos y condiciones." };
    s.publicarTerminosServidor.mockResolvedValue(datos);
    await expect(publicarTerminosAccion(datos)).resolves.toEqual({ exito: true, registro: datos });
    expect(s.publicarTerminosServidor).toHaveBeenCalledWith(datos);
    expect(s.revalidatePath).toHaveBeenCalledWith("/configuracion/terminos");
  });
  it("valida el límite y la forma sin llamar a la API", async () => {
    await expect(publicarTerminosAccion({ texto: "" })).resolves.toMatchObject({ exito: false, errores: { texto: expect.any(String) } });
    await expect(publicarTerminosAccion(null as never)).resolves.toMatchObject({ exito: false });
    await expect(publicarTerminosAccion({ texto: 2 } as never)).resolves.toMatchObject({ exito: false });
    expect(s.publicarTerminosServidor).not.toHaveBeenCalled();
  });
  it("informa un fallo sin mostrar detalles internos", async () => {
    s.publicarTerminosServidor.mockRejectedValue(new Error("detalle interno"));
    const resultado = await publicarTerminosAccion({ texto: "Texto completo de los términos y condiciones." });
    expect(resultado).toMatchObject({ exito: false, mensaje: "No se pudieron guardar los términos y condiciones." });
  });
});
