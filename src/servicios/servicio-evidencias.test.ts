import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  crearEvidencia,
  listarEvidencias,
  obtenerFechaDeHoy,
  obtenerUrlArchivoEvidencia,
} from "@/servicios/servicio-evidencias";

describe("servicio-evidencias", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:4000");

    const evidenciaSimulada = {
      id: 1,
      ordenTrabajoId: 7,
      tipo: "observacion",
      observacion: "Se cambió el filtro",
      fechaRegistro: "2026-10-08",
      creadoEn: "2026-10-08T12:00:00Z",
      nombreArchivo: null,
      tipoContenido: null,
      tieneArchivo: false,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify([evidenciaSimulada]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("obtiene las evidencias de una orden", async () => {
    const evidencias = await listarEvidencias(7);

    expect(evidencias[0].observacion).toBe("Se cambió el filtro");
    expect(fetch).toHaveBeenCalledWith("/api/v1/ordenes-trabajo/7/evidencias", expect.objectContaining({ cache: "no-store" }));
  });

  it("no registra una observación vacía", async () => {
    const evidencia = { tipo: "observacion", observacion: "  ", fechaRegistro: "2026-10-01", archivo: null };

    await expect(crearEvidencia(7, evidencia)).rejects.toThrow("Escribí la observación de la evidencia.");
  });

  it("no registra una foto sin archivo", async () => {
    const evidencia = { tipo: "foto", observacion: "", fechaRegistro: "2026-10-01", archivo: null };

    await expect(crearEvidencia(7, evidencia)).rejects.toThrow("Adjuntá el archivo de la evidencia.");
  });

  it("no acepta una fecha futura", async () => {
    const evidencia = { tipo: "observacion", observacion: "Texto", fechaRegistro: "2999-01-01", archivo: null };

    await expect(crearEvidencia(7, evidencia)).rejects.toThrow("La fecha de registro no puede ser futura.");
  });

  it("devuelve la fecha de hoy con formato año, mes y día", () => {
    expect(obtenerFechaDeHoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("arma la dirección de descarga del archivo", () => {
    expect(obtenerUrlArchivoEvidencia(7, 3)).toBe("/api/v1/ordenes-trabajo/7/evidencias/3/archivo");
  });
});
