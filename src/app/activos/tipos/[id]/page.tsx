"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { listarModelosMaquinaPaginados } from "@/servicios/servicio-modelos-maquina";
import { obtenerDetalleTipoMaquina } from "@/servicios/servicio-tipos-maquina";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

export default function PaginaDetalleTipoMaquina() {
  const parametros = useParams<{ id: string }>();
  const tipoMaquinaId = Number(parametros.id);
  const [tipoMaquina, setTipoMaquina] = useState<TipoMaquina | null>(null);
  const [modelosMaquina, setModelosMaquina] = useState<ModeloMaquina[] | null>(null);
  const [totalModelos, setTotalModelos] = useState(0);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarTipo() {
      try {
        const tipoObtenido = await obtenerDetalleTipoMaquina(tipoMaquinaId);
        setTipoMaquina(tipoObtenido);

        const paginaModelos = await listarModelosMaquinaPaginados({
          buscar: "",
          tipoMaquinaId: String(tipoMaquinaId),
          estado: "",
          pagina: 1,
        });
        setModelosMaquina(paginaModelos.elementos);
        setTotalModelos(paginaModelos.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener la información del tipo de máquina solicitado.");
      }
    }

    cargarTipo();
  }, [tipoMaquinaId]);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (tipoMaquina === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del tipo…</p>;
  }

  let titulo = "Detalle del tipo de máquina";
  let contenido = null;
  if (tipoMaquina !== null) {
    titulo = tipoMaquina.nombre;

    let claseEstado = "status status-inactivo";
    let etiquetaEstado = "Inactivo";
    if (tipoMaquina.estado === "activo") {
      claseEstado = "status status-activo";
      etiquetaEstado = "Activo";
    }

    let listaModelos = <p className="empty-state">Cargando modelos…</p>;
    if (modelosMaquina !== null && modelosMaquina.length === 0) {
      listaModelos = <p className="empty-state">No hay modelos registrados de este tipo.</p>;
    }
    if (modelosMaquina !== null && modelosMaquina.length > 0) {
      listaModelos = (
        <ul className="grid gap-2 text-sm">
          {modelosMaquina.map((modeloMaquina) => (
            <li key={modeloMaquina.id}>
              <Link className="text-link" href={"/activos/modelos/" + modeloMaquina.id}>{modeloMaquina.nombre}</Link>
            </li>
          ))}
        </ul>
      );
    }

    contenido = (
      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="panel detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Nombre</dt>
              <dd>{tipoMaquina.nombre}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd><span className={claseEstado}>{etiquetaEstado}</span></dd>
            </div>
          </dl>
          <div className="form-actions">
            <Link className="primary-button" href={"/activos/tipos/" + tipoMaquina.id + "/editar"}>
              Modificar
            </Link>
          </div>
        </section>

        <section className="panel detail-panel">
          <h2>{"Modelos de este tipo (" + totalModelos + ")"}</h2>
          <div className="mt-4">{listaModelos}</div>
        </section>
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Tipos de máquina</p>
          <h1>{titulo}</h1>
        </div>
        <Link className="secondary-button" href="/activos">
          Volver a activos
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenido}
    </main>
  );
}
