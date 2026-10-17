import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextoMarkdown, transformarUrlSegura } from "./texto-markdown";

function mostrar(texto: string) {
  return render(<TextoMarkdown texto={texto} />).container;
}

describe("transformarUrlSegura", () => {
  it.each(["http://sotra.test", "https://sotra.test/a?b=1", "mailto:ayuda@sotra.test", " https://sotra.test "])("permite %s", (url) => {
    expect(transformarUrlSegura(url)).toBe(url.trim());
  });

  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>x", "vbscript:x", "/relativa", "//sotra.test", "sotra.test", "", "ftp://x.test"])(
    "descarta %s",
    (url) => {
      expect(transformarUrlSegura(url)).toBeNull();
    },
  );
});

describe("texto de los términos en Markdown", () => {
  it("renderiza negrita, cursiva, encabezados, listas, citas y separadores", () => {
    const contenedor = mostrar("## Título\n\n### Sub\n\n**fuerte** y *suave*\n\n- uno\n- dos\n\n1. a\n2. b\n\n> cita\n\n---");
    expect(contenedor.querySelector("h3")).toHaveTextContent("Título");
    expect(contenedor.querySelector("h4")).toHaveTextContent("Sub");
    expect(contenedor.querySelector("strong")).toHaveTextContent("fuerte");
    expect(contenedor.querySelector("em")).toHaveTextContent("suave");
    expect(contenedor.querySelectorAll("ul > li")).toHaveLength(2);
    expect(contenedor.querySelectorAll("ol > li")).toHaveLength(2);
    expect(contenedor.querySelector("blockquote")).toHaveTextContent("cita");
    expect(contenedor.querySelector("hr")).not.toBeNull();
  });

  it("los títulos de nivel 1 y 2 del texto quedan por debajo del título de la pantalla", () => {
    expect(mostrar("# Uno").querySelector("h1, h2")).toBeNull();
    expect(mostrar("## Dos").querySelector("h1, h2")).toBeNull();
  });

  it("los textos publicados con saltos simples se ven igual: el párrafo conserva los saltos (pre-line)", () => {
    const contenedor = mostrar("Primera línea\nSegunda línea\n\nOtro párrafo");
    const parrafos = contenedor.querySelectorAll("p");
    expect(parrafos).toHaveLength(2);
    expect(parrafos[0].textContent).toBe("Primera línea\nSegunda línea");
  });

  it("los enlaces externos se abren en otra pestaña con noopener noreferrer", () => {
    const enlace = mostrar("[sitio](https://sotra.test/x)").querySelector("a");
    expect(enlace).toHaveAttribute("href", "https://sotra.test/x");
    expect(enlace).toHaveAttribute("target", "_blank");
    expect(enlace).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("mailto: es un enlace, sin abrir pestañas", () => {
    const enlace = mostrar("[escribinos](mailto:ayuda@sotra.test)").querySelector("a");
    expect(enlace).toHaveAttribute("href", "mailto:ayuda@sotra.test");
    expect(enlace).not.toHaveAttribute("target");
  });

  describe("cargas hostiles", () => {
    it.each([
      ["javascript:", "[x](javascript:alert(1))", "x"],
      ["data:", "[x](data:text/html;base64,PHNjcmlwdD4=)", "x"],
      ["ruta relativa", "[x](/admin)", "x"],
      ["referencia con mayúsculas", "[x](JAVASCRIPT:alert(1))", "x"],
      ["entidades", "[x](jav&#x61;script:alert(1))", "x"],
    ])("un enlace %s queda como texto sin href", (_nombre, markdown, texto) => {
      const contenedor = mostrar(markdown);
      expect(contenedor.querySelector("a")).toBeNull();
      expect(contenedor.textContent).toContain(texto);
      expect(contenedor.innerHTML).not.toMatch(/javascript:/i);
    });

    it("descarta <script> sin ejecutarlo", () => {
      const contenedor = mostrar("Hola <script>window.__xssMd = 1</script> mundo\n\n<script>window.__xssMd = 2</script>");
      expect(contenedor.querySelector("script")).toBeNull();
      expect(contenedor.innerHTML).not.toContain("<script");
      expect((window as unknown as { __xssMd?: number }).__xssMd).toBeUndefined();
    });

    it("descarta <img onerror>, <iframe> y otros elementos HTML", () => {
      const contenedor = mostrar(
        '<img src=x onerror="window.__xssMd = 3">\n\n<iframe src="http://x.test"></iframe>\n\n<b onclick="x()">negrita html</b>\n\n<a href="javascript:alert(1)">html</a>',
      );
      expect(contenedor.querySelector("img, iframe, b, a, [onclick], [onerror]")).toBeNull();
      expect((window as unknown as { __xssMd?: number }).__xssMd).toBeUndefined();
    });

    it("las imágenes de Markdown no se renderizan", () => {
      const contenedor = mostrar("![descripción](http://x.test/a.png)");
      expect(contenedor.querySelector("img")).toBeNull();
      expect(contenedor.innerHTML).not.toContain("x.test");
    });

    it("nunca produce atributos de eventos ni estilos en línea", () => {
      const contenedor = mostrar('**a** <span style="x" onmouseover="y()">b</span> [c](https://sotra.test "titulo")');
      expect(contenedor.innerHTML).not.toMatch(/onmouseover|style=/);
    });
  });
});
