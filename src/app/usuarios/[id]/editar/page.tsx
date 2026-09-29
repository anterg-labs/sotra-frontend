"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioUsuario } from "@/componentes/formulario-usuario";
import { actualizarUsuario, listarRoles, obtenerDetalleUsuario } from "@/servicios/servicio-usuarios";
import type { CrearUsuarioInput, Rol, UsuarioDetalle } from "@/tipos/usuario";

export default function PaginaEditarUsuario() {
  const parametros = useParams<{ id: string }>();
  const usuarioId = Number(parametros.id);
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null);
  const [roles, setRoles] = useState<Rol[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarDatosFormulario() {
      try {
        const usuarioObtenido = await obtenerDetalleUsuario(usuarioId);
        const rolesObtenidos = await listarRoles();
        setUsuario(usuarioObtenido);
        setRoles(rolesObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener la información del usuario solicitado.");
      }
    }

    cargarDatosFormulario();
  }, [usuarioId]);

  const rutaListado = "/usuarios";

  function guardarUsuario(camposUsuario: CrearUsuarioInput) {
    if (!usuario) {
      throw new Error("No se pudo obtener la información del usuario solicitado.");
    }

    return actualizarUsuario(usuarioId, {
      nombre: camposUsuario.nombre,
      apellido: camposUsuario.apellido,
      correo: camposUsuario.correo,
      telefono: camposUsuario.telefono,
      idsRol: camposUsuario.idsRol,
      estado: usuario.estado,
      fechaIngreso: usuario.fechaIngreso,
    });
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if ((!usuario || !roles) && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del usuario…</p>;
  }

  let formulario = null;
  if (usuario && roles) {
    const idsRolDelUsuario: number[] = [];
    for (const rolDelUsuario of usuario.roles) {
      idsRolDelUsuario.push(rolDelUsuario.id);
    }

    const usuarioInicial = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      telefono: usuario.telefono,
      idsRol: idsRolDelUsuario,
      estado: usuario.estado,
      fechaIngreso: usuario.fechaIngreso,
    };

    formulario = (
      <section className="panel form-panel">
        <FormularioUsuario
          alEnviar={guardarUsuario}
          etiquetaConfirmacion="Confirmar modificación"
          roles={roles}
          rutaCancelar={rutaListado}
          rutaExito={rutaListado}
          usuarioInicial={usuarioInicial}
        />
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de usuarios</p>
          <h1>Modificar usuario</h1>
        </div>
        <Link className="text-link" href={rutaListado}>
          Volver al listado
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {formulario}
    </main>
  );
}
