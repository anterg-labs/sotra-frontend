import { ContenidoEditarModelo } from "./contenido-editar-modelo";

export default async function PaginaEditarModelo(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de modelos de máquina</p>
          <h1>Modificar modelo de máquina</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoEditarModelo params={props.params} />
      </section>
    </main>
  );
}
