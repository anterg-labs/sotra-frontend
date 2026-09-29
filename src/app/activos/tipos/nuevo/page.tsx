"use client";

import { FormularioTipoMaquina } from "@/componentes/formulario-tipo-maquina";
import { crearTipoMaquina } from "@/servicios/servicio-tipos-maquina";

export default function PaginaNuevoTipoMaquina() {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de tipos de máquina</p>
          <h1>Registrar nuevo tipo de máquina</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <FormularioTipoMaquina alEnviar={crearTipoMaquina} etiquetaConfirmacion="Confirmar registro" />
      </section>
    </main>
  );
}
