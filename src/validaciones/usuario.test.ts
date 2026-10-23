import { describe, expect, it } from "vitest";
import { validarCorreo, validarNombrePersona, validarTelefono, validarUsuario } from "./usuario";

describe("validarNombrePersona", () => {
  it.each(["", "   ", "###", "Juan3"])("rechaza %j", (valor) => {
    expect(validarNombrePersona(valor, "Nombre")).toBeDefined();
  });

  it.each(["A", "María José", "O'Brien", "Ana-Lía", "a".repeat(100)])("acepta %j", (valor) => {
    expect(validarNombrePersona(valor, "Nombre")).toBeUndefined();
  });

  it("rechaza más de 100 caracteres", () => {
    expect(validarNombrePersona("a".repeat(101), "Apellido")).toBe(
      "El campo Apellido no puede superar los 100 caracteres.",
    );
  });
});

describe("validarTelefono", () => {
  it.each(["", "abc", "1234abcd"])("rechaza %j", (valor) => {
    expect(validarTelefono(valor)).toBeDefined();
  });

  it("acepta 8 dígitos", () => {
    expect(validarTelefono("99123456")).toBeUndefined();
    expect(validarTelefono("09912345")).toBeUndefined();
  });

  it.each(["099123456", "092624911"])("acepta el celular %j escrito con el 0 inicial (9 dígitos)", (valor) => {
    expect(validarTelefono(valor)).toBeUndefined();
  });

  it.each(["1234567", "123456789", "0991234567"])("rechaza %j por no tener 8 dígitos (ni 9 empezando con 0)", (valor) => {
    expect(validarTelefono(valor)).toBe("El campo teléfono debe tener 8 dígitos (o 9 si empieza con 0).");
  });

  it("avisa que solo admite dígitos antes de revisar el largo", () => {
    expect(validarTelefono("1234567a")).toBe("El campo teléfono solo admite dígitos.");
  });
});

describe("validarCorreo", () => {
  it.each(["", "sin-arroba", "a@b"])("rechaza %j", (valor) => {
    expect(validarCorreo(valor)).toBeDefined();
  });

  it("acepta un correo válido y rechaza uno de 255 caracteres", () => {
    expect(validarCorreo("ana@empresa.com")).toBeUndefined();
    expect(validarCorreo("a".repeat(244) + "@empresa.com")).toBeDefined();
  });
});

describe("validarUsuario", () => {
  const valido = { nombre: "Ana", apellido: "Pérez", correo: "ana@empresa.com", telefono: "99123456" };

  it("un usuario válido no tiene errores: la contraseña la elige el usuario en Keycloak", () => {
    expect(validarUsuario(valido)).toEqual({});
  });

  it("informa los campos inválidos", () => {
    expect(Object.keys(validarUsuario({ ...valido, correo: "x", telefono: "" }))).toEqual(["correo", "telefono"]);
  });
});
