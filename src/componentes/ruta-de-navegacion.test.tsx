import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { migajasDeRuta, ProveedorHistorialNavegacion, RutaDeNavegacion } from "./ruta-de-navegacion";

const estado = vi.hoisted(() => ({ ruta: "/inicio", modal: null as string | null }));
const volver = vi.hoisted(() => vi.fn());
const ir = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => estado.ruta,
  useSelectedLayoutSegment: () => estado.modal,
  useRouter: () => ({ back: volver, push: ir }),
}));

beforeEach(() => {
  estado.ruta = "/inicio";
  estado.modal = null;
  volver.mockReset();
  ir.mockReset();
});

describe("migajasDeRuta", () => {
  it.each([
    ["/ordenes-trabajo", []],
    ["/ordenes-trabajo/8", ["Órdenes de trabajo", "Orden N° 8"]],
    ["/ordenes-trabajo/8/editar", ["Órdenes de trabajo", "Orden N° 8", "Editar"]],
    ["/ordenes-trabajo/nuevo", ["Órdenes de trabajo", "Nueva orden"]],
    ["/clientes/3", ["Clientes", "Detalle del cliente"]],
    ["/activos/modelos", ["Activos", "Modelos de máquina"]],
    ["/activos/modelos/4", ["Activos", "Modelos de máquina", "Detalle del modelo"]],
    ["/activos/tipos/2/editar", ["Activos", "Tipos de máquina", "Detalle del tipo", "Editar"]],
    ["/activos/7", ["Activos", "Detalle del activo"]],
    ["/repuestos/movimientos/9", ["Repuestos", "Movimientos de stock", "Movimiento N° 9"]],
    ["/configuracion/terminos", ["Configuración", "Términos y condiciones"]],
    ["/configuracion/perfil", ["Configuración", "Mi perfil"]],
    ["/configuracion/avisos", ["Configuración", "Reglas de avisos"]],
    ["/configuracion/reportes", ["Configuración", "Reportes"]],
    ["/configuracion/demoras-etapas", ["Configuración", "Demoras por etapa"]],
    ["/tecnico/12", ["Mi trabajo", "Orden N° 12"]],
    ["/usuarios/nuevo", ["Usuarios", "Nuevo usuario"]],
    ["/inicio", []],
    ["/clientes/abc", []],
  ])("%s", (ruta, esperado) => {
    expect(migajasDeRuta(ruta).map((migaja) => migaja.etiqueta)).toEqual(esperado);
  });
});

describe("RutaDeNavegacion", () => {
  it("en una URL directa vuelve al nivel superior", () => {
    estado.ruta = "/configuracion/perfil";
    render(<RutaDeNavegacion />);
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(ir).toHaveBeenCalledWith("/configuracion");
    expect(volver).not.toHaveBeenCalled();
  });

  it("tras navegar dentro de la aplicación vuelve a la página anterior", () => {
    estado.ruta = "/inicio";
    const { rerender } = render(<ProveedorHistorialNavegacion><RutaDeNavegacion /></ProveedorHistorialNavegacion>);
    estado.ruta = "/configuracion/perfil";
    rerender(<ProveedorHistorialNavegacion><RutaDeNavegacion /></ProveedorHistorialNavegacion>);
    fireEvent.click(screen.getByRole("button", { name: "Volver" }));
    expect(volver).toHaveBeenCalledOnce();
    expect(ir).not.toHaveBeenCalled();
  });
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
