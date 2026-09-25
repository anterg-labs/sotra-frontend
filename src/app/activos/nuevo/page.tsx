"use client";

import { useEffect, useState } from "react";
import { FormularioActivo } from "@/componentes/formulario-activo";
import { crearActivo } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import type { Cliente } from "@/tipos/cliente";

export default function PaginaNuevoActivo() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarClientes() {
      try {
        const clientesObtenidos = await listarClientes();
        setClientes(clientesObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de clientes.");
      }
    }

    cargarClientes();
  }, []);

  let contenidoFormulario = null;
  if (clientes === null && !errorCarga) {
    contenidoFormulario = <p className="empty-state">Cargando clientes…</p>;
  }

  if (errorCarga) {
    contenidoFormulario = <p className="form-error-banner">{errorCarga}</p>;
  }

  if (clientes !== null && clientes.length === 0) {
    contenidoFormulario = <p className="empty-state">Primero se debe registrar un cliente.</p>;
  }

  if (clientes !== null && clientes.length > 0) {
    contenidoFormulario = (
      <FormularioActivo
        alEnviar={crearActivo}
        clientes={clientes}
        etiquetaConfirmacion="Confirmar registro"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de activos</p>
          <h1>Registrar nuevo activo</h1>
        </div>
      </header>

      <section className="panel form-panel">
        {contenidoFormulario}
      </section>
    </main>
  );
}
