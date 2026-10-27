import { ContenidoNuevaOrden } from "./contenido-nueva-orden";

export default async function PaginaNuevaOrden() {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Órdenes de trabajo</p>
          <h1>Crear orden de trabajo</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <ContenidoNuevaOrden />
      </section>
    </main>
  );
}
