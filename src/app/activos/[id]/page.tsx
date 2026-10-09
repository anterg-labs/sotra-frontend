"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrdenesAsociadas } from "@/componentes/ordenes-asociadas";
import { obtenerDetalleActivo } from "@/servicios/servicio-activos";
import { obtenerDetalleCliente } from "@/servicios/servicio-clientes";
import {
  listarDocumentosTecnicosPaginados,
  obtenerUrlDescargaDocumentoTecnico,
} from "@/servicios/servicio-documentos-tecnicos";
import { obtenerDetalleModeloMaquina } from "@/servicios/servicio-modelos-maquina";
import type { Activo } from "@/tipos/activo";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";

export default function PaginaDetalleActivo() {
  const parametros = useParams<{ id: string }>();
  const activoId = Number(parametros.id);
  const [activo, setActivo] = useState<Activo | null>(null);
  const [nombreCliente, setNombreCliente] = useState("");
  const [nombreModelo, setNombreModelo] = useState("");
  const [documentos, setDocumentos] = useState<DocumentoTecnico[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarActivo() {
      try {
        const activoObtenido = await obtenerDetalleActivo(activoId);
        setActivo(activoObtenido);

        const clienteObtenido = await obtenerDetalleCliente(activoObtenido.clienteId);
        setNombreCliente(clienteObtenido.razonSocial);

        const modeloObtenido = await obtenerDetalleModeloMaquina(activoObtenido.modeloMaquinaId);
        setNombreModelo(modeloObtenido.nombre);
      } catch {
        setErrorCarga("No se pudo obtener la información del activo solicitado.");
      }

      try {
        const paginaDocumentos = await listarDocumentosTecnicosPaginados({
          buscar: "",
          activoId: String(activoId),
          pagina: 1,
        });
        setDocumentos(paginaDocumentos.elementos);
      } catch {
        setDocumentos([]);
      }
    }

    cargarActivo();
  }, [activoId]);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (activo === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del activo…</p>;
  }

  let titulo = "Detalle del activo";
  let contenido = null;
  if (activo !== null) {
    let nombreActivo = "Sin nombre";
    if (activo.nombre !== null) {
      nombreActivo = activo.nombre;
    }
    titulo = nombreActivo;

    let anio = "Sin dato";
    if (activo.anioFabricacion !== null) {
      anio = String(activo.anioFabricacion);
    }

    let ubicacion = "Sin dato";
    if (activo.ubicacion !== null && activo.ubicacion !== "") {
      ubicacion = activo.ubicacion;
    }

    let descripcion = "Sin descripción";
    if (activo.descripcion !== null && activo.descripcion !== "") {
      descripcion = activo.descripcion;
    }

    let claseEstado = "status status-inactivo";
    let etiquetaEstado = "Inactivo";
    if (activo.estado === "activo") {
      claseEstado = "status status-activo";
      etiquetaEstado = "Activo";
    }

    let listaDocumentos = <p className="empty-state">Cargando documentación…</p>;
    if (documentos !== null && documentos.length === 0) {
      listaDocumentos = <p className="empty-state">Este activo no tiene documentación técnica asociada.</p>;
    }
    if (documentos !== null && documentos.length > 0) {
      listaDocumentos = (
        <ul className="grid gap-2 text-sm">
          {documentos.map((documento) => (
            <li key={documento.id}>
              <a
                className="text-link"
                href={obtenerUrlDescargaDocumentoTecnico(documento.id)}
                rel="noreferrer"
                target="_blank"
              >
                {documento.nombreArchivo}
              </a>
            </li>
          ))}
        </ul>
      );
    }

    contenido = (
      <div className="grid gap-6">
        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="panel detail-panel">
            <dl className="detail-list">
              <div>
                <dt>Número de serie</dt>
                <dd>{activo.numSerie}</dd>
              </div>
              <div>
                <dt>Cliente</dt>
                <dd>{nombreCliente}</dd>
              </div>
              <div>
                <dt>Modelo</dt>
                <dd>
                  <Link className="text-link" href={"/activos/modelos/" + activo.modeloMaquinaId}>{nombreModelo}</Link>
                </dd>
              </div>
              <div>
                <dt>Año de fabricación</dt>
                <dd>{anio}</dd>
              </div>
              <div>
                <dt>Ubicación</dt>
                <dd>{ubicacion}</dd>
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
              <Link className="primary-button" href={"/activos/" + activo.id + "/editar"}>
                Modificar
              </Link>
            </div>
          </section>

          <section className="panel detail-panel">
            <h2>Documentación técnica</h2>
            <div className="mt-4">{listaDocumentos}</div>
          </section>
        </div>

        <OrdenesAsociadas activoId={String(activo.id)} clienteId="" tecnicoId="" titulo="Historial de órdenes de trabajo" />
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Activos</p>
          <h1>{titulo}</h1>
        </div>
        <Link className="secondary-button" href="/activos">
          Volver al listado
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenido}
    </main>
  );
}
