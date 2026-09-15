"use client";

import Link from "next/link";
import { FormularioUsuario } from "@/componentes/formulario-usuario";
import { crearUsuario } from "@/servicios/servicio-usuarios";

export default function PaginaNuevoUsuario() {
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de usuarios</p>
          <h1>Crear nuevo usuario</h1>
          <p className="page-description">
            Registrá un usuario interno indicando sus datos de contacto y contraseña temporal.
          </p>
        </div>
        <Link className="text-link" href="/usuarios">
          Volver al listado
        </Link>
      </header>

      <section className="panel form-panel">
        <FormularioUsuario
          alEnviar={crearUsuario}
          etiquetaConfirmacion="Confirmar creación"
          rutaCancelar="/usuarios"
          rutaExito="/usuarios"
          solicitarContrasenaTemporal
        />
      </section>
    </main>
  );
}
