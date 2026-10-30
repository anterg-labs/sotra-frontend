import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Repuesto } from "@/tipos/repuesto";
import { cantidadMaximaDeLinea, EditorRepuestosOrden, obtenerErrorDeLineas, type LineaRepuestoOrden } from "./editor-repuestos-orden";

const listarRepuestosPaginados = vi.hoisted(() => vi.fn());
vi.mock("@/servicios/servicio-repuestos", () => ({ listarRepuestosPaginados }));

function repuesto(id: number, extra: Partial<Repuesto> = {}): Repuesto {
  return {
    id, codigo: "R" + id, nombre: "Filtro " + id, descripcion: "", marca: "", ubicacion: "", categoria: "", modeloCompatibilidad: "", unidadMedida: "unidad", observaciones: "", cantidad: 10, cantidadMinima: 2,
    cantidadReservada: 3, cantidadEntregada: 2, cantidadDisponible: 5, estado: "activo", estadoStock: "normal", ...extra,
  };
}

const pagina = (elementos: Repuesto[]) => ({ elementos, pagina: 1, tamanoPagina: 20, totalElementos: elementos.length, totalPaginas: 1 });

/** El editor es controlado: este envoltorio guarda las líneas como lo hace el formulario. */
function Envoltorio(props: { inicial: LineaRepuestoOrden[]; propias?: Record<number, number>; alCambiar?: (lineas: LineaRepuestoOrden[]) => void }) {
  const [lineas, setLineas] = useState(props.inicial);
  return (
    <EditorRepuestosOrden
      alCambiar={(nuevas) => {
        setLineas(nuevas);
        props.alCambiar?.(nuevas);
      }}
      cantidadesDeLaOrden={props.propias}
      lineas={lineas}
    />
  );
}

beforeEach(() => {
  listarRepuestosPaginados.mockReset();
});

describe("cantidades del editor de repuestos", () => {
  it("el máximo es lo disponible más lo que la orden ya tiene reservado o entregado", () => {
    const linea = { repuesto: repuesto(1, { cantidadDisponible: 5 }), cantidad: 2 };
    expect(cantidadMaximaDeLinea(linea)).toBe(5);
    expect(cantidadMaximaDeLinea(linea, { 1: 3 })).toBe(8);
  });

  it("rechaza cantidades que no sean enteros desde 1 y las que superan lo disponible, diciendo por qué", () => {
    expect(obtenerErrorDeLineas([{ repuesto: repuesto(1), cantidad: 0 }])).toContain("entera de 1 en adelante");
    expect(obtenerErrorDeLineas([{ repuesto: repuesto(1), cantidad: 1.5 }])).toContain("entera de 1 en adelante");
    expect(obtenerErrorDeLineas([{ repuesto: repuesto(1), cantidad: Number.NaN }])).toContain("entera de 1 en adelante");
    expect(obtenerErrorDeLineas([{ repuesto: repuesto(1, { cantidadDisponible: 5 }), cantidad: 6 }]))
      .toBe("Solo hay 5 disponibles de R1 - Filtro 1 (stock 10, 3 reservadas, 2 entregadas).");
    expect(obtenerErrorDeLineas([{ repuesto: repuesto(1, { cantidadDisponible: 0 }), cantidad: 1 }]))
      .toContain("No hay unidades disponibles de R1 - Filtro 1: hay 10 en stock, 3 reservadas y 2 entregadas a otras órdenes.");
    expect(obtenerErrorDeLineas([{ repuesto: repuesto(1, { cantidad: 0, cantidadReservada: 0, cantidadEntregada: 0, cantidadDisponible: 0 }), cantidad: 1 }]))
      .toBe("No hay stock de R1 - Filtro 1.");
    expect(obtenerErrorDeLineas([{ repuesto: repuesto(1, { cantidadDisponible: 5 }), cantidad: 5 }])).toBe("");
  });
});

describe("EditorRepuestosOrden", () => {
  it("muestra un selector numérico por repuesto, limitado a lo disponible, y avisa si se pasa", () => {
    render(<Envoltorio inicial={[{ repuesto: repuesto(1, { cantidadDisponible: 5 }), cantidad: 2 }]} propias={{ 1: 2 }} />);
    const cantidad = screen.getByLabelText("Cantidad de R1");
    expect(cantidad).toHaveAttribute("type", "number");
    expect(cantidad).toHaveAttribute("min", "1");
    expect(cantidad).toHaveAttribute("max", "7");
    expect(cantidad).toHaveValue(2);
    expect(screen.getByText(/Disponibles para esta orden: 7/)).toBeInTheDocument();

    fireEvent.change(cantidad, { target: { value: "9" } });
    expect(cantidad).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Solo hay 7 disponibles de R1 - Filtro 1");
    fireEvent.change(cantidad, { target: { value: "7" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("busca repuestos activos, muestra sus unidades disponibles y agrega uno con cantidad 1", async () => {
    listarRepuestosPaginados.mockResolvedValue(pagina([repuesto(5, { cantidadDisponible: 4 })]));
    const alCambiar = vi.fn();
    render(<Envoltorio alCambiar={alCambiar} inicial={[]} />);
    expect(screen.getByText("La orden no tiene repuestos.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Agregar repuesto" }), { target: { value: "filtro" } });
    await waitFor(() =>
      expect(listarRepuestosPaginados).toHaveBeenCalledWith({ buscar: "filtro", estado: "activo", ubicacion: "", bajoStock: false, pagina: 1 }),
    );
    fireEvent.click(await screen.findByRole("option", { name: "R5 - Filtro 5 (disponibles: 4)" }));

    expect(alCambiar).toHaveBeenCalledTimes(1);
    expect(alCambiar.mock.calls[0][0].map((linea: LineaRepuestoOrden) => [linea.repuesto.id, linea.cantidad])).toEqual([[5, 1]]);
    expect(screen.getByLabelText("Cantidad de R5")).toHaveValue(1);
  });

  it("no agrega un repuesto sin unidades disponibles y explica si está reservado o entregado", async () => {
    listarRepuestosPaginados.mockResolvedValue(pagina([repuesto(6, { cantidad: 5, cantidadReservada: 5, cantidadEntregada: 0, cantidadDisponible: 0 })]));
    const alCambiar = vi.fn();
    render(<Envoltorio alCambiar={alCambiar} inicial={[]} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Agregar repuesto" }), { target: { value: "r6" } });
    fireEvent.click(await screen.findByRole("option", { name: /R6/ }));

    expect(alCambiar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("No hay unidades disponibles de R6 - Filtro 6: hay 5 en stock, 5 reservadas y 0 entregadas a otras órdenes.");
  });

  it("no ofrece los repuestos que ya están en la orden y permite quitarlos", async () => {
    listarRepuestosPaginados.mockResolvedValue(pagina([repuesto(1), repuesto(2)]));
    render(<Envoltorio inicial={[{ repuesto: repuesto(1), cantidad: 1 }]} />);

    fireEvent.focus(screen.getByRole("combobox", { name: "Agregar repuesto" }));
    await screen.findByRole("option", { name: /R2 - Filtro 2/ });
    expect(within(screen.getByRole("listbox")).getAllByRole("option").map((opcion) => opcion.textContent)).toEqual(["R2 - Filtro 2 (disponibles: 5)"]);

    fireEvent.click(screen.getByRole("button", { name: "Quitar R1" }));
    expect(screen.queryByLabelText("Cantidad de R1")).not.toBeInTheDocument();
    expect(screen.getByText("La orden no tiene repuestos.")).toBeInTheDocument();
  });

  it("vaciar el campo de cantidad lo deja inválido en lugar de tomarlo como cero", () => {
    const alCambiar = vi.fn();
    render(<Envoltorio alCambiar={alCambiar} inicial={[{ repuesto: repuesto(1), cantidad: 2 }]} />);

    fireEvent.change(screen.getByLabelText("Cantidad de R1"), { target: { value: "" } });

    expect(Number.isNaN(alCambiar.mock.calls[0][0][0].cantidad)).toBe(true);
    expect(screen.getByRole("alert")).toHaveTextContent("entera de 1 en adelante");
  });

  it("con más de cinco repuestos pagina de a cinco y, sin repuestos de más, no muestra la paginación", () => {
    const lineas = Array.from({ length: 7 }, (_, indice) => ({ repuesto: repuesto(indice + 1), cantidad: 1 }));
    const { unmount } = render(<Envoltorio inicial={lineas.slice(0, 5)} />);
    expect(screen.queryByRole("navigation", { name: "Páginas de repuestos de la orden" })).not.toBeInTheDocument();
    unmount();

    render(<Envoltorio inicial={lineas} />);
    expect(within(screen.getByRole("list", { name: "Repuestos seleccionados" })).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("Página 1 de 2 · 7 repuestos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(within(screen.getByRole("list", { name: "Repuestos seleccionados" })).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Página 2 de 2 · 7 repuestos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Quitar R6" }));
    fireEvent.click(screen.getByRole("button", { name: "Quitar R7" }));
    expect(screen.queryByRole("navigation", { name: "Páginas de repuestos de la orden" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Repuestos seleccionados" })).getAllByRole("listitem")).toHaveLength(5);
  });
});
