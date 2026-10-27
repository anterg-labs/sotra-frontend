import { ContenidoEditarCliente } from "./contenido-editar-cliente";

export default async function PaginaEditarCliente(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de clientes</p>
          <h1>Modificar cliente</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoEditarCliente params={props.params} />
      </section>
    </main>
  );
}
