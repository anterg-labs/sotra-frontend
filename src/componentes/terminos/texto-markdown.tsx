import ReactMarkdown, { type Components } from "react-markdown";

const PROTOCOLOS_PERMITIDOS = new Set(["http:", "https:", "mailto:"]);

/** Solo `http:`, `https:` y `mailto:`; cualquier otra cosa (por ejemplo `javascript:`) se descarta y el enlace queda como texto. */
export function transformarUrlSegura(url: string): string | null {
  try {
    return PROTOCOLOS_PERMITIDOS.has(new URL(url.trim()).protocol) ? url.trim() : null;
  } catch {
    return null;
  }
}

/** Elementos que nunca se renderizan: imágenes, marcos, scripts y controles de formulario. Su texto interno se conserva. */
const ELEMENTOS_NO_PERMITIDOS = [
  "img", "iframe", "script", "style", "object", "embed", "form", "input", "button", "textarea", "select", "svg", "video", "audio", "link", "meta",
];

const componentes: Components = {
  // Los encabezados del texto quedan por debajo del título de la pantalla (h2) para no romper la jerarquía.
  h1: (props) => <h3>{props.children}</h3>,
  h2: (props) => <h3>{props.children}</h3>,
  h3: (props) => <h4>{props.children}</h4>,
  h4: (props) => <h5>{props.children}</h5>,
  h5: (props) => <h5>{props.children}</h5>,
  h6: (props) => <h5>{props.children}</h5>,
  a: ({ href, children }) => {
    if (!href) return <span>{children}</span>;
    if (href.toLowerCase().startsWith("mailto:")) return <a href={href}>{children}</a>;
    return (
      <a href={href} rel="noopener noreferrer" target="_blank">
        {children}
      </a>
    );
  },
};

/**
 * Texto de los términos: un subconjunto seguro de Markdown. El HTML crudo se descarta (`skipHtml`), no hay imágenes ni
 * marcos, y los enlaces solo pueden ser http, https o mailto. Lo escribe una persona administradora, así que se trata como no confiable.
 */
export function TextoMarkdown(props: { texto: string }) {
  return (
    <div className="texto-terminos">
      <ReactMarkdown
        components={componentes}
        disallowedElements={ELEMENTOS_NO_PERMITIDOS}
        skipHtml
        unwrapDisallowed
        urlTransform={transformarUrlSegura}
      >
        {props.texto}
      </ReactMarkdown>
    </div>
  );
}
