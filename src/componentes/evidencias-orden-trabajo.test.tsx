import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EvidenciasOrdenTrabajo } from "./evidencias-orden-trabajo";

const crearEvidencia = vi.fn();

vi.mock("@/servicios/servicio-evidencias", async (importarOriginal) => ({
  ...await importarOriginal<typeof import("@/servicios/servicio-evidencias")>(),
  crearEvidencia: (...argumentos: unknown[]) => crearEvidencia(...argumentos),
  listarEvidencias: () => Promise.resolve([]),
  obtenerEtiquetaTipoEvidencia: () => "Foto",
  obtenerFechaDeHoy: () => "2026-10-16",
  obtenerUrlArchivoEvidencia: () => "#",
}));

describe("registro de evidencias desde móvil", () => {
  it("enfoca y anuncia la falta de archivo junto al selector", async () => {
    render(<EvidenciasOrdenTrabajo ordenTrabajoId={12} permiteRegistrar />);
    await screen.findByText("Esta orden todavía no tiene evidencias registradas.");
    fireEvent.click(screen.getByRole("button", { name: "Registrar evidencia" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar evidencia" }));

    expect(screen.getByLabelText("Archivo adjunto")).toHaveFocus();
    expect(screen.getByText("Adjuntá el archivo de la evidencia.")).toHaveAttribute("id", "archivoEvidencia-error");
  });

  it("permite elegir una foto con cámara, muestra un nombre largo y la envía", async () => {
    const archivo = new File(["imagen"], `${"nombre-muy-largo-".repeat(10)}.jpg`, { type: "image/jpeg" });
    crearEvidencia.mockResolvedValueOnce({
      id: 9,
      ordenTrabajoId: 12,
      tipo: "foto",
      observacion: "",
      fechaRegistro: "2026-10-16",
      creadoEn: "2026-10-16T12:00:00Z",
      nombreArchivo: archivo.name,
      tipoContenido: "image/jpeg",
      tieneArchivo: true,
    });

    render(<EvidenciasOrdenTrabajo ordenTrabajoId={12} permiteRegistrar />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar evidencia" }));

    const entrada = screen.getByLabelText("Archivo adjunto");
    expect(entrada).toHaveAttribute("capture", "environment");
    expect(entrada).toHaveAttribute("accept", "image/jpeg,image/png");

    fireEvent.change(entrada, { target: { files: [archivo] } });
    expect(screen.getByText(archivo.name)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar evidencia" }));
    await waitFor(() => expect(crearEvidencia).toHaveBeenCalledWith(12, expect.objectContaining({ archivo })));
    expect(await screen.findByText("Evidencia registrada correctamente.")).toBeInTheDocument();
  });
});
