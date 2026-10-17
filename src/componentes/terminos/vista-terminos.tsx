import { formatearFechaCorta } from "@/utilidades/fechas";
import { TextoMarkdown } from "./texto-markdown";

type PropiedadesVistaTerminos = {
  titulo: string;
  texto: string;
  datosAlmacenados: string[];
  /** Si se informa, se muestra «Versión N · publicada el …». La vista previa de un borrador no tiene versión. */
  version?: number;
  creadoEn?: string;
  nivelTitulo?: 2 | 3;
  /** Prefijo para los ids de los encabezados, así varias vistas en la misma pantalla no los repiten. */
  prefijoId: string;
};

/**
 * Muestra los términos: el texto admite un subconjunto seguro de Markdown (ver `TextoMarkdown`) y nunca se interpreta HTML,
 * porque el contenido lo escribe una persona administradora.
 */
export function VistaTerminos(props: PropiedadesVistaTerminos) {
  const { titulo, texto, datosAlmacenados, version, creadoEn, prefijoId } = props;
  const Titulo = props.nivelTitulo === 3 ? "h3" : "h2";
  const idTitulo = prefijoId + "-titulo";
  const idDatos = prefijoId + "-datos";

  return (
    <article aria-labelledby={idTitulo} className="vista-terminos">
      <Titulo id={idTitulo}>{titulo}</Titulo>
      {version !== undefined && creadoEn ? (
        <p className="texto-tenue text-sm">{"Versión " + version + " · publicada el " + formatearFechaCorta(creadoEn)}</p>
      ) : null}
      <TextoMarkdown texto={texto} />
      <section aria-labelledby={idDatos}>
        <h3 id={idDatos}>Datos que se guardan</h3>
        <ul className="lista-datos-terminos">
          {datosAlmacenados.map((dato, indice) => (
            <li key={indice + dato}>{dato}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
