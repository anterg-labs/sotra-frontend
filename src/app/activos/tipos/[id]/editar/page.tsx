import { ContenidoEditarTipo } from "./contenido-editar-tipo";

export default async function PaginaEditarTipo(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de tipos de máquina</p>
          <h1>Modificar tipo de máquina</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoEditarTipo params={props.params} />
      </section>
    </main>
  );
}
