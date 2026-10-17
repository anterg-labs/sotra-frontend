import Link from "next/link";
import { FormularioUsuario } from "@/componentes/formulario-usuario";
import { listarRolesServidor, obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import type { Rol, UsuarioDetalle } from "@/tipos/usuario";
import { actualizarUsuarioAccion } from "../../acciones";

const RUTA_LISTADO = "/usuarios";

async function cargarDatos(usuarioId: number): Promise<{ usuario: UsuarioDetalle; roles: Rol[] } | null> {
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) return null;
  try {
    const [usuario, roles] = await Promise.all([obtenerUsuarioServidor(usuarioId), listarRolesServidor()]);
    return { usuario, roles };
  } catch {
    return null;
  }
}

export default async function PaginaEditarUsuario(props: { params: Promise<{ id: string }> }) {
  const datos = await cargarDatos(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de usuarios</p>
          <h1>Modificar usuario</h1>
        </div>
        <Link className="text-link" href={RUTA_LISTADO}>
          Volver al listado
        </Link>
      </header>

      {datos ? (
        <section className="panel form-panel">
          <FormularioUsuario
            accion={actualizarUsuarioAccion.bind(null, datos.usuario.id, datos.usuario.estado, datos.usuario.fechaIngreso)}
            etiquetaConfirmacion="Confirmar modificación"
            roles={datos.roles}
            rutaCancelar={RUTA_LISTADO}
            rutaExito={RUTA_LISTADO}
            usuarioInicial={{
              nombre: datos.usuario.nombre,
              apellido: datos.usuario.apellido,
              correo: datos.usuario.correo,
              telefono: datos.usuario.telefono,
              idsRol: datos.usuario.roles.map((rol) => rol.id),
              estado: datos.usuario.estado,
              fechaIngreso: datos.usuario.fechaIngreso,
            }}
          />
        </section>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del usuario solicitado.</p>
      )}
    </main>
  );
}
