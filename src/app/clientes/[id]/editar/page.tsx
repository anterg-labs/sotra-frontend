"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioCliente } from "@/componentes/formulario-cliente";
import { actualizarCliente, obtenerDetalleCliente } from "@/servicios/servicio-clientes";
import type { Cliente, CrearClienteInput } from "@/tipos/cliente";

export default function PaginaEditarCliente() {
  const parametros = useParams<{ id: string }>();
  const clienteId = Number(parametros.id);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarCliente() {
      try {
        const clienteObtenido = await obtenerDetalleCliente(clienteId);
        setCliente(clienteObtenido);
      } catch {
        setErrorCarga("No se pudo obtener la información del cliente solicitado.");
      }
    }

    cargarCliente();
  }, [clienteId]);

  function guardarCliente(camposCliente: CrearClienteInput) {
    return actualizarCliente(clienteId, camposCliente);
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (!cliente && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del cliente…</p>;
  }

  let formulario = null;
  if (cliente) {
    formulario = (
      <section className="panel form-panel">
        <FormularioCliente
          alEnviar={guardarCliente}
          clienteInicial={{
            razonSocial: cliente.razonSocial,
            nombreContacto: cliente.nombreContacto,
            correo: cliente.correo,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            observaciones: cliente.observaciones,
          }}
          etiquetaConfirmacion="Confirmar modificación"
        />
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de clientes</p>
          <h1>Modificar cliente</h1>
        </div>
      </header>

      {mensajeError}
      {mensajeCargando}
      {formulario}
    </main>
  );
}
