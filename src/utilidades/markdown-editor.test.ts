import { describe, expect, it } from "vitest";
import { envolver, insertarEnlace, insertarSeparador, prefijarLineas, validarDireccionEnlace, type Edicion } from "./markdown-editor";

/** Aplica la edición al texto como lo haría el navegador. */
function aplicar(valor: string, edicion: Edicion) {
  const nuevo = valor.slice(0, edicion.desde) + edicion.texto + valor.slice(edicion.hasta);
  return { nuevo, seleccion: nuevo.slice(edicion.seleccionDesde, edicion.seleccionHasta) };
}

describe("negrita y cursiva", () => {
  it("sin selección inserta el marcador con un ejemplo seleccionado", () => {
    expect(aplicar("ab", envolver("ab", 1, 1, "**"))).toEqual({ nuevo: "a**texto**b", seleccion: "texto" });
    expect(aplicar("", envolver("", 0, 0, "*"))).toEqual({ nuevo: "*texto*", seleccion: "texto" });
  });

  it("con selección la envuelve y la deja seleccionada", () => {
    expect(aplicar("uno dos tres", envolver("uno dos tres", 4, 7, "**"))).toEqual({ nuevo: "uno **dos** tres", seleccion: "dos" });
    expect(aplicar("uno dos", envolver("uno dos", 4, 7, "*"))).toEqual({ nuevo: "uno *dos*", seleccion: "dos" });
  });

  it("vuelve a quitar el formato si la selección ya lo tiene, dentro o alrededor", () => {
    expect(aplicar("**dos**", envolver("**dos**", 0, 7, "**"))).toEqual({ nuevo: "dos", seleccion: "dos" });
    expect(aplicar("uno **dos**", envolver("uno **dos**", 6, 9, "**"))).toEqual({ nuevo: "uno dos", seleccion: "dos" });
  });

  it("no confunde la cursiva con la negrita", () => {
    expect(aplicar("**dos**", envolver("**dos**", 2, 5, "*")).nuevo).toBe("***dos***");
    expect(aplicar("**dos**", envolver("**dos**", 0, 7, "*")).nuevo).toBe("***dos***");
  });
});

describe("títulos, listas y citas", () => {
  it("sin selección en una línea vacía inserta el prefijo con un ejemplo", () => {
    expect(aplicar("", prefijarLineas("", 0, 0, "titulo"))).toEqual({ nuevo: "## texto", seleccion: "texto" });
    expect(aplicar("a\n", prefijarLineas("a\n", 2, 2, "vinietas")).nuevo).toBe("a\n- texto");
  });

  it("antepone el prefijo a la línea donde está el cursor", () => {
    expect(aplicar("uno\ndos\ntres", prefijarLineas("uno\ndos\ntres", 5, 5, "subtitulo")).nuevo).toBe("uno\n### dos\ntres");
    expect(aplicar("uno\ndos", prefijarLineas("uno\ndos", 1, 1, "cita")).nuevo).toBe("> uno\ndos");
  });

  it("aplica a todas las líneas de la selección y numera la lista", () => {
    const valor = "a\nb\nc";
    expect(aplicar(valor, prefijarLineas(valor, 0, 5, "vinietas")).nuevo).toBe("- a\n- b\n- c");
    expect(aplicar(valor, prefijarLineas(valor, 0, 5, "numerada")).nuevo).toBe("1. a\n2. b\n3. c");
  });

  it("no incluye la línea siguiente si la selección termina justo después de un salto", () => {
    const valor = "a\nb\nc";
    expect(aplicar(valor, prefijarLineas(valor, 0, 4, "vinietas")).nuevo).toBe("- a\n- b\nc");
  });

  it("deja las líneas vacías sin prefijo y numera solo las que tienen contenido", () => {
    expect(aplicar("a\n\nb", prefijarLineas("a\n\nb", 0, 4, "numerada")).nuevo).toBe("1. a\n\n2. b");
  });

  it("reemplaza un encabezado de otro nivel en lugar de apilarlos", () => {
    expect(aplicar("### x", prefijarLineas("### x", 0, 0, "titulo")).nuevo).toBe("## x");
  });

  it("quita el prefijo si todas las líneas ya lo tienen", () => {
    expect(aplicar("- a\n- b", prefijarLineas("- a\n- b", 0, 7, "vinietas")).nuevo).toBe("a\nb");
    expect(aplicar("## x", prefijarLineas("## x", 0, 0, "titulo")).nuevo).toBe("x");
    expect(aplicar("> x", prefijarLineas("> x", 0, 0, "cita")).nuevo).toBe("x");
  });
});

describe("enlace", () => {
  it("usa la selección como texto, o un ejemplo si no hay", () => {
    expect(aplicar("ver sitio hoy", insertarEnlace("ver sitio hoy", 4, 9, "https://sotra.test"))).toEqual({
      nuevo: "ver [sitio](https://sotra.test) hoy",
      seleccion: "sitio",
    });
    expect(aplicar("", insertarEnlace("", 0, 0, " mailto:a@sotra.test "))).toEqual({
      nuevo: "[texto del enlace](mailto:a@sotra.test)",
      seleccion: "texto del enlace",
    });
  });

  it("codifica los paréntesis de la dirección para no romper el Markdown", () => {
    expect(aplicar("x", insertarEnlace("x", 0, 1, "https://sotra.test/a(b)")).nuevo).toBe("[x](https://sotra.test/a%28b%29)");
  });

  it.each([
    ["", "Ingresá la dirección del enlace."],
    ["javascript:alert(1)", expect.stringContaining("http://")],
    ["sotra.test", expect.stringContaining("http://")],
    ["https://", expect.stringContaining("http://")],
    ["mailto:", expect.stringContaining("http://")],
    ["https://sotra test", expect.stringContaining("espacios")],
    ["https://sotra.test/" + "a".repeat(2000), expect.stringContaining("2000")],
  ])("rechaza «%s»", (direccion, mensaje) => {
    expect(validarDireccionEnlace(direccion)).toEqual(mensaje);
  });

  it.each(["https://sotra.test", "http://sotra.test/a?b=1#c", "mailto:ayuda@sotra.test"])("acepta %s", (direccion) => {
    expect(validarDireccionEnlace(direccion)).toBeUndefined();
  });
});

describe("separador", () => {
  it("lo separa del texto con líneas en blanco según el contexto", () => {
    expect(aplicar("", insertarSeparador("", 0, 0)).nuevo).toBe("---\n\n");
    expect(aplicar("uno", insertarSeparador("uno", 3, 3)).nuevo).toBe("uno\n\n---\n\n");
    expect(aplicar("uno\n", insertarSeparador("uno\n", 4, 4)).nuevo).toBe("uno\n\n---\n\n");
    expect(aplicar("uno\n\n", insertarSeparador("uno\n\n", 5, 5)).nuevo).toBe("uno\n\n---\n\n");
  });
});
