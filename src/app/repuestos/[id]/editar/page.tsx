import { ContenidoEditarRepuesto } from "./contenido-editar-repuesto";

export default async function PaginaEditarRepuesto(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de repuestos</p>
          <h1>Modificar repuesto</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoEditarRepuesto params={props.params} />
      </section>
    </main>
  );
}
