"use client";

import { useEffect, useState } from "react";
import { FormularioModeloMaquina } from "@/componentes/formulario-modelo-maquina";
import { crearModeloMaquina } from "@/servicios/servicio-modelos-maquina";
import { listarTiposMaquina } from "@/servicios/servicio-tipos-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

export default function PaginaNuevoModeloMaquina() {
  const [tiposMaquina, setTiposMaquina] = useState<TipoMaquina[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarTiposMaquina() {
      try {
        const tiposObtenidos = await listarTiposMaquina();
        setTiposMaquina(tiposObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de tipos de máquina.");
      }
    }

    cargarTiposMaquina();
  }, []);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (tiposMaquina === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando tipos de máquina…</p>;
  }

  let formulario = null;
  if (tiposMaquina !== null) {
    formulario = (
      <section className="panel form-panel">
        <FormularioModeloMaquina
          alEnviar={crearModeloMaquina}
          etiquetaConfirmacion="Confirmar registro"
          tiposMaquina={tiposMaquina}
        />
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de modelos de máquina</p>
          <h1>Registrar nuevo modelo de máquina</h1>
        </div>
      </header>

      {mensajeError}
      {mensajeCargando}
      {formulario}
    </main>
  );
}
