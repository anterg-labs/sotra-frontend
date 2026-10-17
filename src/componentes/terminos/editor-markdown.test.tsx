import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorMarkdown } from "./editor-markdown";

describe("editor visual de términos", () => {
  it("carga Markdown como formato visible y conserva una única superficie de escritura", async () => {
    render(<EditorMarkdown alCambiar={vi.fn()} id="texto" valor="## Condiciones\n\nTexto con **negrita** y *cursiva*." />);
    const editor = await screen.findByRole("textbox", { name: "Texto" });
    expect(editor).toHaveAttribute("contenteditable", "true");
    expect(editor.querySelector("strong")).toHaveTextContent("negrita");
    expect(editor.querySelector("em")).toHaveTextContent("cursiva");
    expect(editor.querySelector("h2")).toHaveTextContent("Condiciones");
    expect(editor.textContent).not.toContain("**");
  });

  it("rechaza enlaces con protocolos ejecutables", async () => {
    render(<EditorMarkdown alCambiar={vi.fn()} id="texto" valor="Texto de prueba para el editor." />);
    await screen.findByRole("textbox", { name: "Texto" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Enlace" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Enlace" }));
    fireEvent.change(screen.getByLabelText("Dirección del enlace"), { target: { value: "javascript:alert(1)" } });
    fireEvent.click(screen.getByRole("button", { name: "Insertar enlace" }));
    expect(screen.getByRole("alert")).toHaveTextContent("http");
    expect(document.querySelector('a[href^="javascript:"]')).toBeNull();
  });
});
