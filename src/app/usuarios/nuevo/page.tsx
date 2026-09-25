"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormularioUsuario } from "@/componentes/formulario-usuario";
import { crearUsuario, listarRoles } from "@/servicios/servicio-usuarios";
import type { Rol } from "@/tipos/usuario";

export default function PaginaNuevoUsuario() {
  const [roles, setRoles] = useState<Rol[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarRoles() {
      try {
        const rolesObtenidos = await listarRoles();
        setRoles(rolesObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de roles.");
      }
    }

    cargarRoles();
  }, []);

  let contenidoFormulario = null;
  if (roles === null && !errorCarga) {
    contenidoFormulario = <p className="empty-state">Cargando roles…</p>;
  }

  if (errorCarga) {
    contenidoFormulario = <p className="form-error-banner">{errorCarga}</p>;
  }

  if (roles !== null && roles.length === 0) {
    contenidoFormulario = <p className="empty-state">No hay roles disponibles.</p>;
  }

  if (roles !== null && roles.length > 0) {
    contenidoFormulario = (
      <FormularioUsuario
        alEnviar={crearUsuario}
        etiquetaConfirmacion="Confirmar creación"
        roles={roles}
        rutaCancelar="/usuarios"
        rutaExito="/usuarios"
        solicitarContrasena
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de usuarios</p>
          <h1>Crear nuevo usuario</h1>
          <p className="page-description">
            Registrá un usuario interno indicando sus datos de contacto, contraseña y roles.
          </p>
        </div>
        <Link className="text-link" href="/usuarios">
          Volver al listado
        </Link>
      </header>

      <section className="panel form-panel">
        {contenidoFormulario}
      </section>
    </main>
  );
}
