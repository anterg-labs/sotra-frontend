import { BotonRestablecerContrasena } from "../../boton-restablecer-contrasena";
import { EnlaceVolver } from "@/componentes/enlace-volver";
import { FormularioUsuario } from "@/componentes/formulario-usuario";
import { esUsuarioAdministrador, rolesAsignables } from "@/seguridad/permisos";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import { listarRolesServidor, obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import type { Rol, UsuarioDetalle } from "@/tipos/usuario";
import { actualizarUsuarioAccion } from "../../acciones";

const RUTA_LISTADO = "/usuarios";

/** El jefe no puede modificar a un administrador ni asignar ese rol: `puedeModificar` en falso muestra el aviso. */
async function cargarDatos(usuarioId: number): Promise<{ usuario: UsuarioDetalle; roles: Rol[]; puedeModificar: boolean } | null> {
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) return null;
  try {
    const [usuario, roles, puedeGestionarAdministradores] = await Promise.all([
      obtenerUsuarioServidor(usuarioId),
      listarRolesServidor(),
      tienePermisoServidor("usuario.gestionar_administradores"),
    ]);
    return {
      usuario,
      roles: rolesAsignables(roles, puedeGestionarAdministradores),
      puedeModificar: puedeGestionarAdministradores || !esUsuarioAdministrador(usuario),
    };
  } catch {
    return null;
  }
}

export default async function PaginaEditarUsuario(props: { params: Promise<{ id: string }> }) {
  const datos = await cargarDatos(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div className="encabezado-volver">
          <EnlaceVolver etiqueta="Volver al listado" href={RUTA_LISTADO} />
          <div>
            <p className="eyebrow">Gestión de usuarios</p>
            <h1>Modificar usuario</h1>
          </div>
        </div>
        <div className="form-actions">
          {datos?.puedeModificar && datos.usuario.estado === "activo" ? (
            <BotonRestablecerContrasena correo={datos.usuario.correo} usuarioId={datos.usuario.id} />
          ) : null}
        </div>
      </header>

      {datos && !datos.puedeModificar ? (
        <p className="form-error-banner">Solo un administrador puede modificar a un administrador.</p>
      ) : datos ? (
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
