"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioUsuario } from "@/componentes/formulario-usuario";
import { actualizarUsuario, listarRoles, obtenerDetalleUsuario } from "@/servicios/servicio-usuarios";
import type { CrearUsuarioInput, Rol, UsuarioDetalle } from "@/tipos/usuario";

type DatosFormulario = {
  roles: Rol[];
  usuario: UsuarioDetalle;
};

export default function PaginaEditarUsuario() {
  const parametros = useParams<{ id: string }>();
  const usuarioId = Number(parametros.id);
  const [datosFormulario, setDatosFormulario] = useState<DatosFormulario | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarDatosFormulario() {
      try {
        const roles = await listarRoles();
        const usuario = await obtenerDetalleUsuario(usuarioId);

        setDatosFormulario({
          roles,
          usuario,
        });
      } catch {
        setErrorCarga("No se pudo obtener la información del usuario solicitado.");
      }
    }

    cargarDatosFormulario();
  }, [usuarioId]);

  const rutaListado = "/usuarios";

  function guardarUsuario(usuario: CrearUsuarioInput) {
    return actualizarUsuario(usuarioId, {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rolId: usuario.rolId,
    });
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (!datosFormulario && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del usuario…</p>;
  }

  let mensajeSinRoles = null;
  if (datosFormulario && datosFormulario.roles.length === 0) {
    mensajeSinRoles = <p className="empty-state">No hay roles disponibles.</p>;
  }

  let formulario = null;
  if (datosFormulario && datosFormulario.roles.length > 0) {
    formulario = (
      <section className="panel form-panel">
        <FormularioUsuario
          alEnviar={guardarUsuario}
          etiquetaConfirmacion="Confirmar modificación"
          roles={datosFormulario.roles}
          rutaCancelar={rutaListado}
          rutaExito={rutaListado}
          usuarioInicial={datosFormulario.usuario}
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
      {mensajeSinRoles}
      {formulario}
    </main>
  );
}
