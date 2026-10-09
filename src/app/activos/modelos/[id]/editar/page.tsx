"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioModeloMaquina } from "@/componentes/formulario-modelo-maquina";
import { actualizarModeloMaquina, obtenerDetalleModeloMaquina } from "@/servicios/servicio-modelos-maquina";
import { listarTiposMaquina } from "@/servicios/servicio-tipos-maquina";
import type {
  ActualizarModeloMaquinaInput,
  CrearModeloMaquinaInput,
  EstadoModeloMaquina,
  ModeloMaquina,
} from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

export default function PaginaEditarModeloMaquina() {
  const parametros = useParams<{ id: string }>();
  const modeloMaquinaId = Number(parametros.id);
  const [modeloMaquina, setModeloMaquina] = useState<ModeloMaquina | null>(null);
  const [tiposMaquina, setTiposMaquina] = useState<TipoMaquina[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [estaActivo, setEstaActivo] = useState(false);

  useEffect(() => {
    async function cargarDatosFormulario() {
      try {
        const modeloObtenido = await obtenerDetalleModeloMaquina(modeloMaquinaId);
        const tiposObtenidos = await listarTiposMaquina();
        setModeloMaquina(modeloObtenido);
        setTiposMaquina(tiposObtenidos);
        setEstaActivo(modeloObtenido.estado === "activo");
      } catch {
        setErrorCarga("No se pudo obtener la información del modelo de máquina solicitado.");
      }
    }

    cargarDatosFormulario();
  }, [modeloMaquinaId]);

  function cambiarEstaActivo(evento: React.ChangeEvent<HTMLInputElement>) {
    setEstaActivo(evento.target.checked);
  }

  function guardarModeloMaquina(camposModeloMaquina: CrearModeloMaquinaInput) {
    let estado: EstadoModeloMaquina = "inactivo";
    if (estaActivo) {
      estado = "activo";
    }

    const modeloMaquinaParaGuardar: ActualizarModeloMaquinaInput = {
      nombre: camposModeloMaquina.nombre,
      tipoMaquinaId: camposModeloMaquina.tipoMaquinaId,
      descripcion: camposModeloMaquina.descripcion,
      estado: estado,
    };

    return actualizarModeloMaquina(modeloMaquinaId, modeloMaquinaParaGuardar);
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if ((modeloMaquina === null || tiposMaquina === null) && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del modelo de máquina…</p>;
  }

  let formulario = null;
  if (modeloMaquina !== null && tiposMaquina !== null) {
    formulario = (
      <section className="panel form-panel">
        <div className="form-field mb-4">
          <label htmlFor="estaActivo">
            <input checked={estaActivo} id="estaActivo" onChange={cambiarEstaActivo} type="checkbox" /> Activo
          </label>
        </div>
        <FormularioModeloMaquina
          alEnviar={guardarModeloMaquina}
          etiquetaConfirmacion="Confirmar modificación"
          modeloMaquinaInicial={modeloMaquina}
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
          <h1>Modificar modelo de máquina</h1>
        </div>
      </header>

      {mensajeError}
      {mensajeCargando}
      {formulario}
    </main>
  );
}
