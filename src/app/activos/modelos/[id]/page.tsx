"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { obtenerDetalleModeloMaquina } from "@/servicios/servicio-modelos-maquina";
import { obtenerDetalleTipoMaquina } from "@/servicios/servicio-tipos-maquina";
import type { Activo } from "@/tipos/activo";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";

export default function PaginaDetalleModeloMaquina() {
  const parametros = useParams<{ id: string }>();
  const modeloMaquinaId = Number(parametros.id);
  const [modeloMaquina, setModeloMaquina] = useState<ModeloMaquina | null>(null);
  const [nombreTipo, setNombreTipo] = useState("");
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [totalActivos, setTotalActivos] = useState(0);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarModelo() {
      try {
        const modeloObtenido = await obtenerDetalleModeloMaquina(modeloMaquinaId);
        setModeloMaquina(modeloObtenido);

        const tipoObtenido = await obtenerDetalleTipoMaquina(modeloObtenido.tipoMaquinaId);
        setNombreTipo(tipoObtenido.nombre);

        const paginaActivos = await listarActivosPaginados({
          buscar: "",
          clienteId: "",
          modeloMaquinaId: String(modeloMaquinaId),
          estado: "",
          pagina: 1,
        });
        setActivos(paginaActivos.elementos);
        setTotalActivos(paginaActivos.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener la información del modelo de máquina solicitado.");
      }
    }

    cargarModelo();
  }, [modeloMaquinaId]);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (modeloMaquina === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del modelo…</p>;
  }

  let titulo = "Detalle del modelo de máquina";
  let contenido = null;
  if (modeloMaquina !== null) {
    titulo = modeloMaquina.nombre;

    let descripcion = "Sin descripción";
    if (modeloMaquina.descripcion !== null && modeloMaquina.descripcion !== "") {
      descripcion = modeloMaquina.descripcion;
    }

    let claseEstado = "status status-inactivo";
    let etiquetaEstado = "Inactivo";
    if (modeloMaquina.estado === "activo") {
      claseEstado = "status status-activo";
      etiquetaEstado = "Activo";
    }

    let listaActivos = <p className="empty-state">Cargando activos…</p>;
    if (activos !== null && activos.length === 0) {
      listaActivos = <p className="empty-state">No hay activos registrados con este modelo.</p>;
    }
    if (activos !== null && activos.length > 0) {
      listaActivos = (
        <ul className="grid gap-2 text-sm">
          {activos.map((activo) => {
            let nombreActivo = activo.numSerie;
            if (activo.nombre !== null && activo.nombre !== "") {
              nombreActivo = activo.nombre + " (" + activo.numSerie + ")";
            }

            return (
              <li key={activo.id}>
                <Link className="text-link" href={"/activos/" + activo.id}>{nombreActivo}</Link>
              </li>
            );
          })}
        </ul>
      );
    }

    contenido = (
      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="panel detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Tipo de máquina</dt>
              <dd>
                <Link className="text-link" href={"/activos/tipos/" + modeloMaquina.tipoMaquinaId}>{nombreTipo}</Link>
              </dd>
            </div>
            <div>
              <dt>Descripción</dt>
              <dd>{descripcion}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd><span className={claseEstado}>{etiquetaEstado}</span></dd>
            </div>
          </dl>
          <div className="form-actions">
            <Link className="primary-button" href={"/activos/modelos/" + modeloMaquina.id + "/editar"}>
              Modificar
            </Link>
          </div>
        </section>

        <section className="panel detail-panel">
          <h2>{"Activos de este modelo (" + totalActivos + ")"}</h2>
          <div className="mt-4">{listaActivos}</div>
        </section>
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Modelos de máquina</p>
          <h1>{titulo}</h1>
        </div>
        <Link className="secondary-button" href="/activos?seccion=modelos">
          Volver a activos
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenido}
    </main>
  );
}
