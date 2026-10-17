import { describe, expect, it } from "vitest";
import { validarActivo, type CamposValidablesActivo } from "./activo";
import { validarCliente, type CamposValidablesCliente } from "./cliente";
import { validarNombreCatalogo, validarTipoMaquinaSeleccionado } from "./maquinaria";

const activoValido: CamposValidablesActivo = {
  nombre: "Retro 1",
  numSerie: "SN-001",
  clienteId: "1",
  modeloMaquinaId: "2",
  anioFabricacion: "2020",
  ubicacion: "Depósito",
};

describe("validarActivo", () => {
  it("no devuelve errores con datos válidos u opcionales vacíos", () => {
    expect(validarActivo(activoValido)).toEqual({});
    expect(validarActivo({ ...activoValido, nombre: "", anioFabricacion: " ", ubicacion: "" })).toEqual({});
  });

  it("exige número de serie, cliente y modelo", () => {
    const errores = validarActivo({ ...activoValido, numSerie: "  ", clienteId: "", modeloMaquinaId: "" });
    expect(errores).toEqual({
      numSerie: "El campo Número de serie es obligatorio.",
      clienteId: "Debe seleccionar un cliente.",
      modeloMaquinaId: "Debe seleccionar un modelo de máquina.",
    });
  });

  it.each([
    ["numSerie", "a".repeat(101), "100"],
    ["nombre", "a".repeat(101), "100"],
    ["ubicacion", "a".repeat(151), "150"],
  ] as const)("rechaza %s por encima del límite y acepta exactamente el límite", (campo, largo, limite) => {
    expect(validarActivo({ ...activoValido, [campo]: largo })[campo]).toContain(limite);
    expect(validarActivo({ ...activoValido, [campo]: "a".repeat(Number(limite)) })[campo]).toBeUndefined();
  });

  it.each(["1899", "2101", "20.5", "abc", "-1"])("rechaza el año %j", (anio) => {
    expect(validarActivo({ ...activoValido, anioFabricacion: anio }).anioFabricacion).toMatch(/entre 1900 y 2100/);
  });

  it.each(["1900", "2100"])("acepta el año límite %j", (anio) => {
    expect(validarActivo({ ...activoValido, anioFabricacion: anio }).anioFabricacion).toBeUndefined();
  });
});

describe("validarCliente", () => {
  const clienteValido: CamposValidablesCliente = {
    razonSocial: "ACME S.A.",
    nombreContacto: "Luis Gómez",
    correo: "",
    telefono: "",
    direccion: "",
  };

  it("acepta correo y teléfono vacíos", () => {
    expect(validarCliente(clienteValido)).toEqual({});
  });

  it("exige razón social y contacto no vacíos", () => {
    const errores = validarCliente({ ...clienteValido, razonSocial: "  ", nombreContacto: "" });
    expect(errores.razonSocial).toBe("El campo Nombre o razón social es obligatorio.");
    expect(errores.nombreContacto).toBe("El campo Nombre de contacto es obligatorio.");
  });

  it("aplica los límites de largo", () => {
    expect(validarCliente({ ...clienteValido, razonSocial: "a".repeat(161) }).razonSocial).toContain("160");
    expect(validarCliente({ ...clienteValido, nombreContacto: "a".repeat(121) }).nombreContacto).toContain("120");
    expect(validarCliente({ ...clienteValido, direccion: "a".repeat(256) }).direccion).toContain("255");
    expect(validarCliente({ ...clienteValido, razonSocial: "a".repeat(160), direccion: "a".repeat(255) })).toEqual({});
  });

  it("valida el formato del correo y del teléfono solo si se informan", () => {
    const errores = validarCliente({ ...clienteValido, correo: "sin-arroba", telefono: "abc" });
    expect(errores.correo).toBeDefined();
    expect(errores.telefono).toBeDefined();
    expect(validarCliente({ ...clienteValido, correo: "a@b.com", telefono: "099123456" })).toEqual({});
  });
});

describe("validaciones de maquinaria", () => {
  it("el nombre del catálogo es obligatorio y admite hasta 60 caracteres", () => {
    expect(validarNombreCatalogo("  ")).toBe("El campo Nombre es obligatorio.");
    expect(validarNombreCatalogo("a".repeat(61))).toContain("60");
    expect(validarNombreCatalogo("a".repeat(60))).toBeUndefined();
  });

  it("exige seleccionar un tipo de máquina", () => {
    expect(validarTipoMaquinaSeleccionado("")).toBe("Debe seleccionar un tipo de máquina.");
    expect(validarTipoMaquinaSeleccionado("3")).toBeUndefined();
  });
});
