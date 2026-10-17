import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./combobox";

const opciones = [
  { valor: "1", etiqueta: "Álamo" },
  { valor: "2", etiqueta: "Cedro" },
  { valor: "3", etiqueta: "Roble" },
];

function dibujar(valor = "", buscarOpciones?: (consulta: string) => Promise<typeof opciones>) {
  const alCambiar = vi.fn();
  render(
    <Combobox
      alCambiar={alCambiar}
      buscarOpciones={buscarOpciones}
      etiqueta="Activo"
      id="activo"
      opciones={opciones}
      valor={valor}
    />,
  );
  return alCambiar;
}

describe("Combobox", () => {
  it("filtra ignorando tildes y elige una opción con el teclado", () => {
    const alCambiar = dibujar();
    const entrada = screen.getByRole("combobox", { name: "Activo" });

    fireEvent.focus(entrada);
    fireEvent.change(entrada, { target: { value: "alamo" } });

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Álamo" })).toBeDefined();
    fireEvent.keyDown(entrada, { key: "Enter" });

    expect(alCambiar).toHaveBeenCalledExactlyOnceWith("1");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("muestra un estado vacío y permite limpiar la selección", () => {
    const alCambiar = dibujar("2");
    const entrada = screen.getByRole("combobox", { name: "Activo" });

    expect(entrada).toHaveProperty("value", "Cedro");
    fireEvent.click(screen.getByRole("button", { name: "Limpiar Activo" }));
    expect(alCambiar).toHaveBeenCalledExactlyOnceWith("");

    fireEvent.change(entrada, { target: { value: "inexistente" } });
    expect(screen.getByText("Sin resultados")).toBeDefined();
  });

  it("permite recorrer opciones y cerrar con Escape", () => {
    const alCambiar = dibujar();
    const entrada = screen.getByRole("combobox", { name: "Activo" });

    fireEvent.focus(entrada);
    fireEvent.keyDown(entrada, { key: "ArrowDown" });
    fireEvent.keyDown(entrada, { key: "Enter" });
    expect(alCambiar).toHaveBeenCalledExactlyOnceWith("2");

    fireEvent.focus(entrada);
    fireEvent.keyDown(entrada, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("elige una opción al pulsarla", () => {
    const alCambiar = dibujar();
    fireEvent.focus(screen.getByRole("combobox", { name: "Activo" }));
    fireEvent.pointerDown(screen.getByRole("option", { name: "Roble" }));

    expect(alCambiar).toHaveBeenCalledExactlyOnceWith("3");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("consulta el servidor tras el debounce y muestra sus opciones", async () => {
    const buscarOpciones = vi.fn().mockResolvedValue([{ valor: "4", etiqueta: "Fresno" }]);
    dibujar("", buscarOpciones);

    fireEvent.change(screen.getByRole("combobox", { name: "Activo" }), { target: { value: "fres" } });

    await waitFor(() => expect(buscarOpciones).toHaveBeenCalledExactlyOnceWith("fres"));
    expect(await screen.findByRole("option", { name: "Fresno" })).toBeDefined();
  });

  it("conserva visible la opción remota elegida aunque no esté en la primera página", async () => {
    const buscarOpciones = vi.fn().mockResolvedValue([{ valor: "4", etiqueta: "Fresno" }]);
    function Ejemplo() {
      const [valor, setValor] = useState("");
      return <Combobox alCambiar={setValor} buscarOpciones={buscarOpciones} etiqueta="Activo" id="activo" opciones={opciones} valor={valor} />;
    }
    render(<Ejemplo />);

    const entrada = screen.getByRole("combobox", { name: "Activo" });
    fireEvent.change(entrada, { target: { value: "fres" } });
    fireEvent.click(await screen.findByRole("option", { name: "Fresno" }));

    expect(entrada).toHaveProperty("value", "Fresno");
    fireEvent.focus(entrada);
    fireEvent.keyDown(entrada, { key: "Escape" });
    expect(entrada).toHaveProperty("value", "Fresno");
  });
});
