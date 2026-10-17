/** Marcador de posición del listado mientras llegan los datos (Suspense y navegación entre páginas). */
export function EsqueletoListado(props: { etiqueta: string }) {
  return (
    <div aria-busy="true" aria-label={props.etiqueta} className="grid gap-3" role="status">
      {Array.from({ length: 6 }, (_, fila) => (
        <span
          aria-hidden="true"
          className="block h-10 animate-pulse rounded bg-current opacity-10 motion-reduce:animate-none"
          key={fila}
        />
      ))}
      <span className="sr-only">{props.etiqueta}</span>
    </div>
  );
}
