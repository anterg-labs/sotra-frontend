/** Esqueleto genérico para los `loading.tsx` de cada ruta (listado, detalle y edición). */
export function CargandoPagina() {
  return (
    <main aria-busy="true" className="page-content" role="status">
      <div className="carga-pagina-estado">
        <span aria-hidden="true" className="indicador-carga" />
        <p>Cargando contenido…</p>
      </div>
      <section className="panel grid gap-4">
        <span aria-hidden="true" className="block h-6 w-1/3 animate-pulse rounded bg-current opacity-10 motion-reduce:animate-none" />
        <span aria-hidden="true" className="block h-40 animate-pulse rounded bg-current opacity-10 motion-reduce:animate-none" />
      </section>
    </main>
  );
}
