import { ContenidoEditarActivo } from "./contenido-editar-activo";

export default async function PaginaEditarActivo(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de activos</p>
          <h1>Modificar activo</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoEditarActivo params={props.params} />
      </section>
    </main>
  );
}
