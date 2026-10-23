import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearDocumentoTecnico } from "@/servicios/servicio-documentos-tecnicos";

describe("servicio-documentos-tecnicos", () => {
  const fetchSimulado = vi.fn();

  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");
    fetchSimulado.mockReset();
    fetchSimulado.mockResolvedValue(Response.json({ id: 1, nombreArchivo: "manual.pdf" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchSimulado);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sube el PDF como multipart al endpoint de la API", async () => {
    const archivo = new File(["%PDF-1.7 contenido"], "manual.pdf", { type: "application/pdf" });
    const documento = await crearDocumentoTecnico({ archivo, titulo: "", tipo: "manual_tecnico", descripcion: "", activoId: 3, modeloMaquinaId: null, usaSugerenciasIA: true });

    expect(documento.id).toBe(1);
    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(url).toBe("/api/v1/documentos-tecnicos");
    expect(opciones.method).toBe("POST");
    expect((opciones.body as FormData).get("activoId")).toBe("3");
    expect((opciones.body as FormData).get("tipo")).toBe("manual_tecnico");
    expect((opciones.body as FormData).has("titulo")).toBe(false);
  });

  it("no llama a la API con un archivo inválido", async () => {
    await expect(crearDocumentoTecnico({ archivo: null, titulo: "", tipo: "manual_tecnico", descripcion: "", activoId: null, modeloMaquinaId: null, usaSugerenciasIA: false })).rejects.toThrow("Seleccioná un archivo PDF.");
    await expect(
      crearDocumentoTecnico({ archivo: new File(["hola"], "falso.pdf"), titulo: "", tipo: "manual_tecnico", descripcion: "", activoId: null, modeloMaquinaId: null, usaSugerenciasIA: false }),
    ).rejects.toThrow("El archivo no es un PDF válido.");
    expect(fetchSimulado).not.toHaveBeenCalled();
  });
});
