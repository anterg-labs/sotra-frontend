import { describe, expect, it } from "vitest";
import { obtenerFechaDeHoy } from "./fecha";
import {
  obtenerErroresAjusteStock,
  obtenerErroresEgresoStock,
  obtenerErroresIngresoStock,
  obtenerEtiquetaTipoMovimiento,
} from "./movimiento-stock";
import { obtenerErroresRepuesto, obtenerErrorStockMinimo } from "./repuesto";

describe("validaciones de repuestos", () => {
  const repuesto = { codigo: "R1", nombre: "Filtro", descripcion: "", marca: "", ubicacion: "", cantidad: 1, cantidadMinima: 0 };

  it("valida cada campo con su mensaje", () => {
    expect(obtenerErroresRepuesto(repuesto)).toEqual({});
    expect(obtenerErroresRepuesto({ ...repuesto, codigo: " ", nombre: "", cantidad: -1, cantidadMinima: 1.5 })).toEqual({
      codigo: "El código del repuesto es obligatorio.",
      nombre: "El nombre del repuesto es obligatorio.",
      cantidad: "La cantidad debe ser un número entero mayor o igual a cero.",
      cantidadMinima: "La cantidad mínima debe ser un número entero mayor o igual a cero.",
    });
    const largos = obtenerErroresRepuesto({ ...repuesto, codigo: "a".repeat(51), nombre: "a".repeat(121), marca: "a".repeat(101), ubicacion: "a".repeat(121) });
    expect(Object.keys(largos)).toEqual(["codigo", "nombre", "marca", "ubicacion"]);
    expect(obtenerErroresRepuesto({ ...repuesto, codigo: "a".repeat(50), nombre: "a".repeat(120) })).toEqual({});
  });

  it("valida el stock mínimo", () => {
    expect(obtenerErrorStockMinimo(-1)).toContain("mayor o igual a cero");
    expect(obtenerErrorStockMinimo(2.5)).not.toBe("");
    expect(obtenerErrorStockMinimo(0)).toBe("");
  });
});

describe("validaciones de movimientos de stock", () => {
  const ingreso = { cantidad: 3, fecha: obtenerFechaDeHoy(), motivo: "Compra", ubicacion: "Pañol", observaciones: "" };

  it("valida el ingreso: cantidad entera positiva, fecha no futura, motivo y ubicación", () => {
    expect(obtenerErroresIngresoStock(ingreso)).toEqual({});
    expect(obtenerErroresIngresoStock({ ...ingreso, cantidad: 0 }).cantidad).toContain("mayor a cero");
    expect(obtenerErroresIngresoStock({ ...ingreso, cantidad: 1.5 }).cantidad).toBeDefined();
    expect(obtenerErroresIngresoStock({ ...ingreso, fecha: "" }).fecha).toBe("Indicá la fecha del ingreso.");
    expect(obtenerErroresIngresoStock({ ...ingreso, fecha: "2999-01-01" }).fecha).toContain("futura");
    expect(obtenerErroresIngresoStock({ ...ingreso, motivo: " ", ubicacion: "" })).toMatchObject({
      motivo: expect.any(String),
      ubicacion: expect.any(String),
    });
  });

  it("valida el egreso contra el stock disponible", () => {
    expect(obtenerErroresEgresoStock({ cantidad: 5, motivo: "Uso" }, 5)).toEqual({});
    expect(obtenerErroresEgresoStock({ cantidad: 6, motivo: "Uso" }, 5).cantidad).toBe("No hay stock suficiente: disponible 5.");
    expect(obtenerErroresEgresoStock({ cantidad: 0, motivo: "" }, 5)).toMatchObject({ cantidad: expect.any(String), motivo: "Indicá el motivo del egreso." });
  });

  it("valida el ajuste: stock real >= 0 y motivo", () => {
    expect(obtenerErroresAjusteStock({ cantidadReal: 0, motivo: "Conteo" })).toEqual({});
    expect(obtenerErroresAjusteStock({ cantidadReal: -1, motivo: " " })).toMatchObject({
      cantidadReal: expect.any(String),
      motivo: "Indicá el motivo del ajuste.",
    });
  });

  it("traduce los tipos de movimiento", () => {
    expect(obtenerEtiquetaTipoMovimiento("ingreso")).toBe("Ingreso");
    expect(obtenerEtiquetaTipoMovimiento("egreso")).toBe("Egreso");
    expect(obtenerEtiquetaTipoMovimiento("ajuste")).toBe("Ajuste");
  });
});

describe("fecha de hoy", () => {
  it("tiene formato ISO con ceros", () => {
    expect(obtenerFechaDeHoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
