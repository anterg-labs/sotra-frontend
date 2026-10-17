import { FormularioCliente } from "@/componentes/formulario-cliente";
import { crearClienteAccion } from "../acciones";

export default function PaginaNuevoCliente() {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de clientes</p>
          <h1>Registrar nuevo cliente</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <FormularioCliente accion={crearClienteAccion} etiquetaConfirmacion="Confirmar registro" />
      </section>
    </main>
  );
}
