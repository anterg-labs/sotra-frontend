"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioTipoMaquina } from "@/componentes/formulario-tipo-maquina";
import { actualizarTipoMaquina, obtenerDetalleTipoMaquina } from "@/servicios/servicio-tipos-maquina";
import type {
  ActualizarTipoMaquinaInput,
  CrearTipoMaquinaInput,
  EstadoTipoMaquina,
  TipoMaquina,
} from "@/tipos/tipo-maquina";

export default function PaginaEditarTipoMaquina() {
  const parametros = useParams<{ id: string }>();
  const tipoMaquinaId = Number(parametros.id);
  const [tipoMaquina, setTipoMaquina] = useState<TipoMaquina | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [estaActivo, setEstaActivo] = useState(false);

  useEffect(() => {
    async function cargarTipoMaquina() {
      try {
        const tipoObtenido = await obtenerDetalleTipoMaquina(tipoMaquinaId);
        setTipoMaquina(tipoObtenido);
        setEstaActivo(tipoObtenido.estado === "activo");
      } catch {
        setErrorCarga("No se pudo obtener la información del tipo de máquina solicitado.");
      }
    }

    cargarTipoMaquina();
  }, [tipoMaquinaId]);

  function cambiarEstaActivo(evento: React.ChangeEvent<HTMLInputElement>) {
    setEstaActivo(evento.target.checked);
  }

  function guardarTipoMaquina(camposTipoMaquina: CrearTipoMaquinaInput) {
    let estado: EstadoTipoMaquina = "inactivo";
    if (estaActivo) {
      estado = "activo";
    }

    const tipoMaquinaParaGuardar: ActualizarTipoMaquinaInput = {
      nombre: camposTipoMaquina.nombre,
      estado: estado,
    };

    return actualizarTipoMaquina(tipoMaquinaId, tipoMaquinaParaGuardar);
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (tipoMaquina === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del tipo de máquina…</p>;
  }

  let formulario = null;
  if (tipoMaquina !== null) {
    formulario = (
      <section className="panel form-panel">
        <div className="form-field mb-4">
          <label htmlFor="estaActivo">
            <input checked={estaActivo} id="estaActivo" onChange={cambiarEstaActivo} type="checkbox" /> Activo
          </label>
        </div>
        <FormularioTipoMaquina
          alEnviar={guardarTipoMaquina}
          etiquetaConfirmacion="Confirmar modificación"
          tipoMaquinaInicial={tipoMaquina}
        />
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de tipos de máquina</p>
          <h1>Modificar tipo de máquina</h1>
        </div>
      </header>

      {mensajeError}
      {mensajeCargando}
      {formulario}
    </main>
  );
}
