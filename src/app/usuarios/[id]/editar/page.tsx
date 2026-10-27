import { ContenidoEditarUsuario } from "./contenido-editar-usuario";
import { EnlaceVolver } from "@/componentes/enlace-volver";

export default async function PaginaEditarUsuario(props: { params: Promise<{ id: string }> }) {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div className="encabezado-volver">
          <EnlaceVolver etiqueta="Volver al listado" href="/usuarios" />
          <div>
            <p className="eyebrow">Gestión de usuarios</p>
            <h1>Modificar usuario</h1>
          </div>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoEditarUsuario params={props.params} />
      </section>
    </main>
  );
}
