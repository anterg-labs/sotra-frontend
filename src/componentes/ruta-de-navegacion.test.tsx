import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { migajasDeRuta, RutaDeNavegacion } from "./ruta-de-navegacion";

const estado = vi.hoisted(() => ({ ruta: "/inicio", modal: null as string | null }));

vi.mock("next/navigation", () => ({
  usePathname: () => estado.ruta,
  useSelectedLayoutSegment: () => estado.modal,
}));

beforeEach(() => {
  estado.ruta = "/inicio";
  estado.modal = null;
});

describe("migajasDeRuta", () => {
  it.each([
    ["/ordenes-trabajo", []],
    ["/ordenes-trabajo/8", ["Órdenes de trabajo", "Orden N° 8"]],
    ["/ordenes-trabajo/8/editar", ["Órdenes de trabajo", "Orden N° 8", "Modificar"]],
    ["/ordenes-trabajo/nuevo", ["Órdenes de trabajo", "Nuevo orden"]],
    ["/clientes/3", ["Clientes", "Detalle del cliente"]],
    ["/activos/modelos", ["Activos", "Modelos de máquina"]],
    ["/activos/modelos/4", ["Activos", "Modelos de máquina", "Detalle del modelo"]],
    ["/activos/tipos/2/editar", ["Activos", "Tipos de máquina", "Detalle del tipo", "Modificar"]],
    ["/activos/7", ["Activos", "Detalle del activo"]],
    ["/repuestos/movimientos/9", ["Repuestos", "Movimientos de stock", "Movimiento N° 9"]],
    ["/configuracion/terminos", ["Configuración", "Términos y condiciones"]],
    ["/usuarios/nuevo", ["Usuarios", "Nuevo usuario"]],
    ["/inicio", []],
    ["/clientes/abc", []],
  ])("%s", (ruta, esperado) => {
    expect(migajasDeRuta(ruta).map((migaja) => migaja.etiqueta)).toEqual(esperado);
  });
});

describe("RutaDeNavegacion", () => {
  it("muestra los niveles anteriores como enlaces y el actual como texto", () => {
    estado.ruta = "/ordenes-trabajo/8";
    render(<RutaDeNavegacion />);
    expect(screen.getByRole("navigation", { name: "Ruta de navegación" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Órdenes de trabajo" })).toHaveAttribute("href", "/ordenes-trabajo");
    expect(screen.getByText("Orden N° 8")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Orden N° 8" })).not.toBeInTheDocument();
  });

  it("enlaza cada nivel intermedio con su propia ruta", () => {
    estado.ruta = "/activos/modelos/4";
    render(<RutaDeNavegacion />);
    expect(screen.getByRole("link", { name: "Activos" })).toHaveAttribute("href", "/activos");
    expect(screen.getByRole("link", { name: "Modelos de máquina" })).toHaveAttribute("href", "/activos/modelos");
  });

  it("no aparece en pantallas de primer nivel ni con un modal abierto", () => {
    estado.ruta = "/clientes";
    const { container, rerender } = render(<RutaDeNavegacion />);
    expect(container).toBeEmptyDOMElement();
    estado.ruta = "/clientes/3/editar";
    estado.modal = "editar";
    rerender(<RutaDeNavegacion />);
    expect(container).toBeEmptyDOMElement();
  });
});
