import Link from "next/link";
import { AltaUsuario } from "@/componentes/alta-usuario";
import { listarRolesServidor } from "@/servicios/servidor/usuarios";

export default async function PaginaNuevoUsuario() {
  const roles = await listarRolesServidor().catch(() => null);

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
        <AltaUsuario roles={roles} />
      </section>
    </main>
  );
}
