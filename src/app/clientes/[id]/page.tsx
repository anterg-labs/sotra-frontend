"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrdenesAsociadas } from "@/componentes/ordenes-asociadas";
import { listarActivosPaginados } from "@/servicios/servicio-activos";
import { obtenerDetalleCliente } from "@/servicios/servicio-clientes";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";

export default function PaginaDetalleCliente() {
  const parametros = useParams<{ id: string }>();
  const clienteId = Number(parametros.id);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [totalActivos, setTotalActivos] = useState(0);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarCliente() {
      try {
        const clienteObtenido = await obtenerDetalleCliente(clienteId);
        setCliente(clienteObtenido);
      } catch {
        setErrorCarga("No se pudo obtener la información del cliente solicitado.");
      }

      try {
        const paginaActivos = await listarActivosPaginados({
          buscar: "",
          clienteId: String(clienteId),
          modeloMaquinaId: "",
          estado: "",
          pagina: 1,
        });
        setActivos(paginaActivos.elementos);
        setTotalActivos(paginaActivos.totalElementos);
      } catch {
        setActivos([]);
      }
    }

    cargarCliente();
  }, [clienteId]);

  function mostrarTexto(valor: string | null) {
    if (valor === null || valor === "") {
      return "Sin dato";
    }

    return valor;
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (cliente === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del cliente…</p>;
  }

  let titulo = "Detalle del cliente";
  let contenido = null;
  if (cliente !== null) {
    titulo = cliente.razonSocial;

    let claseEstado = "status status-inactivo";
    let etiquetaEstado = "Inactivo";
    if (cliente.estado === "activo") {
      claseEstado = "status status-activo";
      etiquetaEstado = "Activo";
    }

    let listaActivos = <p className="empty-state">Cargando activos…</p>;
    if (activos !== null && activos.length === 0) {
      listaActivos = <p className="empty-state">Este cliente no tiene activos registrados.</p>;
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
      <div className="grid gap-6">
        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="panel detail-panel">
            <dl className="detail-list">
              <div>
                <dt>Contacto</dt>
                <dd>{cliente.nombreContacto}</dd>
              </div>
              <div>
                <dt>Correo electrónico</dt>
                <dd>{mostrarTexto(cliente.correo)}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{mostrarTexto(cliente.telefono)}</dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{mostrarTexto(cliente.direccion)}</dd>
              </div>
              <div>
                <dt>Observaciones</dt>
                <dd>{mostrarTexto(cliente.observaciones)}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd><span className={claseEstado}>{etiquetaEstado}</span></dd>
              </div>
            </dl>
            <div className="form-actions">
              <Link className="primary-button" href={"/clientes/" + cliente.id + "/editar"}>
                Modificar
              </Link>
            </div>
          </section>

          <section className="panel detail-panel">
            <h2>{"Activos del cliente (" + totalActivos + ")"}</h2>
            <div className="mt-4">{listaActivos}</div>
          </section>
        </div>

        <OrdenesAsociadas
          activoId=""
          clienteId={String(cliente.id)}
          tecnicoId=""
          titulo="Actividad: órdenes de trabajo del cliente"
        />
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de clientes</p>
          <h1>{titulo}</h1>
        </div>
        <Link className="secondary-button" href="/clientes">
          Volver al listado
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenido}
    </main>
  );
}
