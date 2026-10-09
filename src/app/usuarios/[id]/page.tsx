"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrdenesAsociadas } from "@/componentes/ordenes-asociadas";
import { obtenerDetalleUsuario } from "@/servicios/servicio-usuarios";
import type { UsuarioDetalle } from "@/tipos/usuario";

export default function PaginaDetalleUsuario() {
  const parametros = useParams<{ id: string }>();
  const usuarioId = Number(parametros.id);
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const usuarioObtenido = await obtenerDetalleUsuario(usuarioId);
        setUsuario(usuarioObtenido);
      } catch {
        setErrorCarga("No se pudo obtener la información del usuario solicitado.");
      }
    }

    cargarUsuario();
  }, [usuarioId]);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (usuario === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del usuario…</p>;
  }

  let titulo = "Detalle de usuario";
  let contenido = null;
  if (usuario !== null) {
    titulo = usuario.nombre + " " + usuario.apellido;

    let claseEstado = "status status-inactivo";
    let etiquetaEstado = "Inactivo";
    if (usuario.estado === "activo") {
      claseEstado = "status status-activo";
      etiquetaEstado = "Activo";
    }

    let textoRoles = "Sin roles";
    if (usuario.roles.length > 0) {
      textoRoles = "";
      for (const rol of usuario.roles) {
        if (textoRoles !== "") {
          textoRoles = textoRoles + ", ";
        }
        textoRoles = textoRoles + rol.nombre;
      }
    }

    contenido = (
      <div className="grid gap-6">
        <section className="panel detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Correo electrónico</dt>
              <dd>{usuario.correo}</dd>
            </div>
            <div>
              <dt>Número de teléfono</dt>
              <dd>{usuario.telefono}</dd>
            </div>
            <div>
              <dt>Roles asignados</dt>
              <dd>{textoRoles}</dd>
            </div>
            <div>
              <dt>Fecha de ingreso</dt>
              <dd>{usuario.fechaIngreso}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd><span className={claseEstado}>{etiquetaEstado}</span></dd>
            </div>
          </dl>
          <div className="form-actions">
            <Link className="primary-button" href={"/usuarios/" + usuario.id + "/editar"}>
              Modificar
            </Link>
          </div>
        </section>

        <OrdenesAsociadas
          activoId=""
          clienteId=""
          tecnicoId={String(usuario.id)}
          titulo="Actividad: órdenes de trabajo asignadas"
        />
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de usuarios</p>
          <h1>{titulo}</h1>
        </div>
        <Link className="secondary-button" href="/usuarios">
          Volver al listado
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenido}
    </main>
  );
}
