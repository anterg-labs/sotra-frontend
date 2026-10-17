import { FormularioRepuesto } from "@/componentes/formulario-repuesto";
import { crearRepuestoAccion } from "../acciones";

export default function PaginaNuevoRepuesto() {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de repuestos</p>
          <h1>Registrar nuevo repuesto</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <FormularioRepuesto accion={crearRepuestoAccion} etiquetaConfirmacion="Confirmar registro" />
      </section>
    </main>
  );
}
