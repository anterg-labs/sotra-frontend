"use client";

import { useEffect, useState } from "react";
import { FormularioActivo } from "@/componentes/formulario-activo";
import { crearActivo } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import { listarModelosMaquina } from "@/servicios/servicio-modelos-maquina";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";

export default function PaginaNuevoActivo() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [modelosMaquina, setModelosMaquina] = useState<ModeloMaquina[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarDatosFormulario() {
      try {
        const clientesObtenidos = await listarClientes();
        const modelosObtenidos = await listarModelosMaquina();
        setClientes(clientesObtenidos);
        setModelosMaquina(modelosObtenidos);
      } catch {
        setErrorCarga("No se pudieron obtener los datos necesarios para registrar el activo.");
      }
    }

    cargarDatosFormulario();
  }, []);

  let tieneClienteActivo = false;
  if (clientes !== null) {
    for (const cliente of clientes) {
      if (cliente.estado === "activo") {
        tieneClienteActivo = true;
      }
    }
  }

  let tieneModeloActivo = false;
  if (modelosMaquina !== null) {
    for (const modeloMaquina of modelosMaquina) {
      if (modeloMaquina.estado === "activo") {
        tieneModeloActivo = true;
      }
    }
  }

  let contenidoFormulario = null;
  if ((clientes === null || modelosMaquina === null) && !errorCarga) {
    contenidoFormulario = <p className="empty-state">Cargando datos del activo…</p>;
  }

  if (errorCarga) {
    contenidoFormulario = <p className="form-error-banner">{errorCarga}</p>;
  }

  if (clientes !== null && !tieneClienteActivo) {
    contenidoFormulario = <p className="empty-state">Primero se debe registrar un cliente activo.</p>;
  }

  if (modelosMaquina !== null && !tieneModeloActivo) {
    contenidoFormulario = <p className="empty-state">Primero se debe registrar un modelo de máquina activo.</p>;
  }

  if (clientes !== null && tieneClienteActivo && modelosMaquina !== null && tieneModeloActivo) {
    contenidoFormulario = (
      <FormularioActivo
        alEnviar={crearActivo}
        clientes={clientes}
        etiquetaConfirmacion="Confirmar registro"
        modelosMaquina={modelosMaquina}
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
