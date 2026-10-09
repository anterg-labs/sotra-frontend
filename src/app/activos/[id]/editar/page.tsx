"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioActivo } from "@/componentes/formulario-activo";
import { actualizarActivo, obtenerDetalleActivo } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import { listarModelosMaquina } from "@/servicios/servicio-modelos-maquina";
import type { Activo, ActualizarActivoInput, CrearActivoInput, EstadoActivo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";

export default function PaginaEditarActivo() {
  const parametros = useParams<{ id: string }>();
  const activoId = Number(parametros.id);
  const [activo, setActivo] = useState<Activo | null>(null);
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [modelosMaquina, setModelosMaquina] = useState<ModeloMaquina[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [estaActivo, setEstaActivo] = useState(false);

  useEffect(() => {
    async function cargarDatosFormulario() {
      try {
        const activoObtenido = await obtenerDetalleActivo(activoId);
        const clientesObtenidos = await listarClientes();
        const modelosObtenidos = await listarModelosMaquina();
        setActivo(activoObtenido);
        setEstaActivo(activoObtenido.estado === "activo");
        setClientes(clientesObtenidos);
        setModelosMaquina(modelosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener la información del activo solicitado.");
      }
    }

    cargarDatosFormulario();
  }, [activoId]);

  function cambiarEstaActivo(evento: React.ChangeEvent<HTMLInputElement>) {
    setEstaActivo(evento.target.checked);
  }

  function guardarActivo(camposActivo: CrearActivoInput) {
    let estado: EstadoActivo = "inactivo";
    if (estaActivo) {
      estado = "activo";
    }

    const activoParaGuardar: ActualizarActivoInput = {
      clienteId: camposActivo.clienteId,
      numSerie: camposActivo.numSerie,
      descripcion: camposActivo.descripcion,
      modeloMaquinaId: camposActivo.modeloMaquinaId,
      anioFabricacion: camposActivo.anioFabricacion,
      nombre: camposActivo.nombre,
      ubicacion: camposActivo.ubicacion,
      estado: estado,
    };

    return actualizarActivo(activoId, activoParaGuardar);
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if ((!activo || !clientes || !modelosMaquina) && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del activo…</p>;
  }

  let formulario = null;
  if (activo && clientes && modelosMaquina) {
    formulario = (
      <section className="panel form-panel">
        <div className="form-field mb-4">
          <label htmlFor="estaActivo">
            <input checked={estaActivo} id="estaActivo" onChange={cambiarEstaActivo} type="checkbox" /> Activo
          </label>
        </div>
        <FormularioActivo
          activoInicial={activo}
          alEnviar={guardarActivo}
          clientes={clientes}
          etiquetaConfirmacion="Confirmar modificación"
          modelosMaquina={modelosMaquina}
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
