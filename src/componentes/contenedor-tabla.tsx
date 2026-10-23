/**
 * Contenedor de una tabla ancha. Cuando la tabla no cabe en pantallas angostas el contenedor se desplaza, y sin foco
 * una persona que usa solo el teclado no podría moverlo. Por eso es una región enfocable con un nombre propio.
 */
export function ContenedorTabla(props: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div aria-label={props.etiqueta} className="table-container" role="region" tabIndex={0}>
      {props.children}
    </div>
  );
}
