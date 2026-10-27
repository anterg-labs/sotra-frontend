import { ContenidoNuevoDocumento } from "./contenido-nuevo-documento";

export default async function PaginaNuevoDocumento() {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Documentación</p>
          <h1>Cargar documento técnico</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoNuevoDocumento />
      </section>
    </main>
  );
}
