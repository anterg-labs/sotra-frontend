import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { FormularioTerminos } from "./formulario-terminos";
import PaginaConfiguracionTerminos from "./page";

const s = vi.hoisted(() => ({ obtenerTerminosVigentesServidor: vi.fn(), publicarTerminosAccion: vi.fn(), mostrarAviso: vi.fn() }));
vi.mock("@/servicios/servidor/terminos", () => ({ obtenerTerminosVigentesServidor: s.obtenerTerminosVigentesServidor }));
vi.mock("@/componentes/avisos", () => ({ useAvisos: () => ({ mostrarAviso: s.mostrarAviso }) }));
vi.mock("./acciones", () => ({ publicarTerminosAccion: s.publicarTerminosAccion }));
vi.mock("@/componentes/terminos/editor-markdown", () => ({ EditorMarkdown: (props: { id: string; valor: string; alCambiar: (valor: string) => void }) => <textarea aria-label="Texto" id={props.id} onChange={evento => props.alCambiar(evento.target.value)} value={props.valor} /> }));
const documento = { id: 1, version: 2, texto: "Texto completo de los términos y condiciones.", vigente: true, creadoEn: "2026-10-17T12:00:00Z" };

beforeEach(() => {
  Object.values(s).forEach(f => f.mockReset());
  s.obtenerTerminosVigentesServidor.mockResolvedValue(documento);
});

describe("edición de un único texto de términos", () => {
  it("muestra un solo campo y abre la vista previa únicamente desde el botón", () => {
    render(<FormularioTerminos inicial={documento} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Texto" })).toHaveValue(documento.texto);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "## Condiciones\n\nTexto con **formato** y <script>alert(1)</script>." } });
    fireEvent.click(screen.getByRole("button", { name: "Vista previa" }));
    const modal = screen.getByRole("dialog", { name: "Términos y condiciones" });
    expect(within(modal).getByRole("heading", { name: "Condiciones" })).toBeInTheDocument();
    expect(modal.querySelector("strong")).toHaveTextContent("formato");
    expect(modal.querySelector("script")).toBeNull();
    fireEvent.click(within(modal).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("## Condiciones\n\nTexto con **formato** y <script>alert(1)</script>.");
  });

  it("rechaza texto vacío y enfoca el único campo", async () => {
    render(<FormularioTerminos inicial={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El texto debe tener entre 20 y 20000");
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus());
    expect(s.publicarTerminosAccion).not.toHaveBeenCalled();
  });

  it("confirma el reemplazo y envía solo el texto, sin autor ni campos adicionales", async () => {
    s.publicarTerminosAccion.mockResolvedValue({ exito: true, registro: documento });
    render(<FormularioTerminos inicial={documento} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    const modal = await screen.findByRole("dialog", { name: "Guardar términos y condiciones" });
    expect(s.publicarTerminosAccion).not.toHaveBeenCalled();
    fireEvent.click(within(modal).getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(s.publicarTerminosAccion).toHaveBeenCalledWith({ texto: documento.texto }));
    expect(s.mostrarAviso).toHaveBeenCalledWith("exito", "Términos guardados.");
  });

  it("cancelar conserva el texto y no guarda", async () => {
    render(<FormularioTerminos inicial={documento} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    expect(s.publicarTerminosAccion).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue(documento.texto);
  });

  it("la página no carga historial ni muestra versión, autor o textos retirados", async () => {
    render(await PaginaConfiguracionTerminos());
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByText(/En vivo|Así se verá|vigente|historial|Publica/)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("un 404 permite definir el texto y los otros errores se informan", async () => {
    s.obtenerTerminosVigentesServidor.mockRejectedValueOnce(new ErrorDeApi("No hay.", null, 404));
    const { unmount } = render(await PaginaConfiguracionTerminos());
    expect(screen.getByRole("textbox")).toHaveValue("");
    unmount();
    s.obtenerTerminosVigentesServidor.mockRejectedValueOnce(new Error("red"));
    render(await PaginaConfiguracionTerminos());
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo obtener el texto");
  });
});
