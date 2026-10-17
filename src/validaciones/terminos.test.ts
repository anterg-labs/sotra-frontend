import { describe, expect, it } from "vitest";
import { validarTerminos } from "./terminos";

describe("texto libre de términos", () => {
  it.each(["", " ".repeat(20), "x".repeat(19), "x".repeat(20001)])("rechaza texto fuera del límite", texto => {
    expect(validarTerminos({ texto })).toHaveProperty("texto");
  });
  it.each(["x".repeat(20), "x".repeat(20000), "## Título\n\nTexto con **formato** libre."])("acepta límites exactos y formato", texto => {
    expect(validarTerminos({ texto })).toEqual({});
  });
});
