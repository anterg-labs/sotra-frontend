"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioRepuesto } from "@/componentes/formulario-repuesto";
import { actualizarRepuesto, obtenerDetalleRepuesto } from "@/servicios/servicio-repuestos";
import type { CrearRepuestoInput, Repuesto } from "@/tipos/repuesto";

export default function PaginaEditarRepuesto() {
  const parametros = useParams<{ id: string }>();
  const repuestoId = Number(parametros.id);
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarRepuesto() {
      try {
        const repuestoObtenido = await obtenerDetalleRepuesto(repuestoId);
        setRepuesto(repuestoObtenido);
      } catch {
        setErrorCarga("No se pudo obtener la información del repuesto solicitado.");
      }
    }

    cargarRepuesto();
  }, [repuestoId]);

  function guardarRepuesto(camposRepuesto: CrearRepuestoInput) {
    return actualizarRepuesto(repuestoId, camposRepuesto);
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (repuesto === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del repuesto…</p>;
  }

  let formulario = null;
  if (repuesto !== null) {
    formulario = (
      <section className="panel form-panel">
        <FormularioRepuesto
          alEnviar={guardarRepuesto}
          etiquetaConfirmacion="Confirmar modificación"
          repuestoInicial={repuesto}
        />
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de repuestos</p>
          <h1>Modificar repuesto</h1>
        </div>
      </header>

      {mensajeError}
      {mensajeCargando}
      {formulario}
    </main>
  );
}
