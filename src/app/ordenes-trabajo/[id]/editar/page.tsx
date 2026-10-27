import { ContenidoEditarOrden } from "./contenido-editar-orden";

export default async function PaginaEditarOrden(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Órdenes de trabajo</p>
          <h1>Modificar orden de trabajo</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoEditarOrden params={props.params} />
      </section>
    </main>
  );
}
