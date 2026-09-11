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
        setErrorCarga("No se pudieron obtener los roles disponibles.");
      }
    }

    cargarRoles();
  }, []);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (roles === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando roles…</p>;
  }

  let mensajeSinRoles = null;
  if (roles && roles.length === 0) {
    mensajeSinRoles = <p className="empty-state">No hay roles disponibles para crear usuarios.</p>;
  }

  let formulario = null;
  if (roles && roles.length > 0) {
    formulario = (
      <section className="panel form-panel">
        <FormularioUsuario
          alEnviar={crearUsuario}
          etiquetaConfirmacion="Confirmar creación"
          roles={roles}
          rutaCancelar="/usuarios"
          rutaExito="/usuarios"
          solicitarContrasenaTemporal
        />
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de usuarios</p>
          <h1>Crear nuevo usuario</h1>
          <p className="page-description">
            Registrá un usuario interno indicando sus datos de contacto, contraseña temporal y rol asignado.
          </p>
        </div>
        <Link className="text-link" href="/usuarios">
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
