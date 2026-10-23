import Link from "next/link";
import { AltaUsuario } from "@/componentes/alta-usuario";
import { rolesAsignables } from "@/seguridad/permisos";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import { listarRolesServidor } from "@/servicios/servidor/usuarios";

export default async function PaginaNuevoUsuario() {
  const [todos, puedeGestionarAdministradores] = await Promise.all([
    listarRolesServidor().catch(() => null),
    tienePermisoServidor("usuario.gestionar_administradores"),
  ]);
  // El jefe no puede asignar el rol Administrador.
  const roles = todos === null ? null : rolesAsignables(todos, puedeGestionarAdministradores);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de usuarios</p>
          <h1>Crear nuevo usuario</h1>
          <p className="page-description">
            Registrá un usuario interno indicando sus datos de contacto y roles. Le llega un correo para elegir su contraseña.
          </p>
        </div>
        <Link className="text-link" href="/usuarios">
          Volver al listado
        </Link>
      </header>

      <section className="panel form-panel">
        <AltaUsuario roles={roles} />
      </section>
    </main>
  );
}
