"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioActivo } from "@/componentes/formulario-activo";
import { actualizarActivo, obtenerDetalleActivo } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import type { Activo, CrearActivoInput } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";

export default function PaginaEditarActivo() {
  const parametros = useParams<{ id: string }>();
  const activoId = Number(parametros.id);
  const [activo, setActivo] = useState<Activo | null>(null);
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarDatosFormulario() {
      try {
        const activoObtenido = await obtenerDetalleActivo(activoId);
        const clientesObtenidos = await listarClientes();
        setActivo(activoObtenido);
        setClientes(clientesObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener la información del activo solicitado.");
      }
    }

    cargarDatosFormulario();
  }, [activoId]);

  function guardarActivo(camposActivo: CrearActivoInput) {
    return actualizarActivo(activoId, camposActivo);
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if ((!activo || !clientes) && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del activo…</p>;
  }

  let formulario = null;
  if (activo && clientes) {
    formulario = (
      <section className="panel form-panel">
        <FormularioActivo
          activoInicial={activo}
          alEnviar={guardarActivo}
          clientes={clientes}
          etiquetaConfirmacion="Confirmar modificación"
        />
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de activos</p>
          <h1>Modificar activo</h1>
        </div>
      </header>

      {mensajeError}
      {mensajeCargando}
      {formulario}
    </main>
  );
}
