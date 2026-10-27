import { BotonRestablecerContrasena } from "../../boton-restablecer-contrasena";
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

/** Formulario de modificación de un usuario, con el restablecimiento de contraseña; lo usan la página completa y el modal de ruta. */
export async function ContenidoEditarUsuario(props: { params: Promise<{ id: string }> }) {
  const datos = await cargarDatos(Number((await props.params).id));

  if (!datos) return <p className="form-error-banner">No se pudo obtener la información del usuario solicitado.</p>;
  if (!datos.puedeModificar) return <p className="form-error-banner">Solo un administrador puede modificar a un administrador.</p>;

  return (
    <>
      {datos.usuario.estado === "activo" ? (
        <div className="form-actions" style={{ marginTop: 0, marginBottom: 20, justifyContent: "flex-start" }}>
          <BotonRestablecerContrasena correo={datos.usuario.correo} usuarioId={datos.usuario.id} />
        </div>
      ) : null}
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
    </>
  );
}
