"use client";

import { FormularioRepuesto } from "@/componentes/formulario-repuesto";
import { crearRepuesto } from "@/servicios/servicio-repuestos";

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
        <FormularioRepuesto alEnviar={crearRepuesto} etiquetaConfirmacion="Confirmar registro" />
      </section>
    </main>
  );
}
