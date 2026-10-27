import { ContenidoEditarDocumento } from "./contenido-editar-documento";

export default async function PaginaEditarDocumento(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Documentación</p>
          <h1>Modificar documento</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoEditarDocumento params={props.params} />
      </section>
    </main>
  );
}
