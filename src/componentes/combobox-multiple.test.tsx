import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComboboxMultiple } from "./combobox-multiple";

const opciones = [
  { valor: "1", etiqueta: "Pañolero" },
  { valor: "2", etiqueta: "Técnico" },
  { valor: "3", etiqueta: "Jefe" },
];

function Ejemplo() {
  const [valores, setValores] = useState<string[]>([]);
  return <ComboboxMultiple alCambiar={setValores} etiqueta="Roles" id="roles" opciones={opciones} valores={valores} />;
}

describe("ComboboxMultiple", () => {
  it("selecciona varios valores sin cerrar y permite quitar uno", () => {
    render(<Ejemplo />);
    const entrada = screen.getByRole("combobox", { name: "Roles" });

    fireEvent.focus(entrada);
    fireEvent.click(screen.getByRole("option", { name: "Pañolero" }));
    fireEvent.click(screen.getByRole("option", { name: "Técnico" }));

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-multiselectable", "true");
    expect(screen.getByRole("option", { name: /Pañolero/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: /Técnico/ })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: "Quitar Pañolero" }));
    expect(screen.getByRole("option", { name: /Pañolero/ })).toHaveAttribute("aria-selected", "false");
  });

  it("filtra, selecciona con teclado y cierra con Escape", () => {
    render(<Ejemplo />);
    const entrada = screen.getByRole("combobox", { name: "Roles" });

    fireEvent.change(entrada, { target: { value: "tecnico" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.keyDown(entrada, { key: "Enter" });
    expect(screen.getByRole("option", { name: /Técnico/ })).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(entrada, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("recuerda un repuesto buscado en otra página al cambiar la búsqueda", async () => {
    const buscarOpciones = async () => [{ valor: "8", etiqueta: "Filtro remoto" }];
    function EjemploRemoto() {
      const [valores, setValores] = useState<string[]>([]);
      return <ComboboxMultiple alCambiar={setValores} buscarOpciones={buscarOpciones} etiqueta="Repuestos" id="repuestos" opciones={[]} valores={valores} />;
    }
    render(<EjemploRemoto />);

    const entrada = screen.getByRole("combobox", { name: "Repuestos" });
    fireEvent.change(entrada, { target: { value: "filtro" } });
    fireEvent.click(await screen.findByRole("option", { name: "Filtro remoto" }));
    expect(screen.getByRole("button", { name: "Quitar Filtro remoto" })).toBeInTheDocument();

    fireEvent.change(entrada, { target: { value: "otro" } });
    expect(screen.getByRole("button", { name: "Quitar Filtro remoto" })).toBeInTheDocument();
  });
});
