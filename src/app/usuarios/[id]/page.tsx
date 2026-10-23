import Link from "next/link";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { OrdenesAsociadas } from "@/componentes/ordenes-asociadas";
import { obtenerEstadoTerminosServidor } from "@/servicios/servidor/terminos";
import { esUsuarioAdministrador } from "@/seguridad/permisos";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import { obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import type { EstadoTerminos } from "@/tipos/terminos";
import type { UsuarioDetalle } from "@/tipos/usuario";
import { formatearFechaNumerica } from "@/utilidades/fechas";
import { BotonRestablecerContrasena } from "../boton-restablecer-contrasena";

async function cargarUsuario(usuarioId: number): Promise<UsuarioDetalle | null> {
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) return null;
  try {
    return await obtenerUsuarioServidor(usuarioId);
  } catch {
    return null;
  }
}

async function cargarEstadoTerminos(usuarioId: number): Promise<EstadoTerminos | null> {
  try {
    return await obtenerEstadoTerminosServidor(usuarioId);
  } catch {
    return null;
  }
}

function textoEstadoTerminos(estado: EstadoTerminos | null) {
  if (estado === null) return "No se pudo consultar";
  const fecha = estado.aceptadoEn ? formatearFechaNumerica(estado.aceptadoEn) : "";
  if (!estado.pendiente) return "Aceptó la versión " + estado.versionAceptada + " el " + fecha;
  if (estado.versionAceptada !== null) return "Pendiente (última aceptada: versión " + estado.versionAceptada + " el " + fecha + ")";
  return "Pendiente";
}

export default async function PaginaDetalleUsuario(props: { params: Promise<{ id: string }> }) {
  const usuario = await cargarUsuario(Number((await props.params).id));
  const estadoTerminos = usuario ? await cargarEstadoTerminos(usuario.id) : null;
  // El jefe ve a los administradores, pero no los modifica.
  const puedeModificar = usuario !== null && ((await tienePermisoServidor("usuario.gestionar_administradores")) || !esUsuarioAdministrador(usuario));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de usuarios</p>
          <h1>{usuario ? usuario.nombre + " " + usuario.apellido : "Detalle de usuario"}</h1>
        </div>
        <Link className="secondary-button" href="/usuarios">
          Volver al listado
        </Link>
      </header>

      {usuario ? (
        <div className="grid gap-6">
          <section className="panel detail-panel">
            <dl className="detail-list">
              <div>
                <dt>Correo electrónico</dt>
                <dd>{usuario.correo}</dd>
              </div>
              <div>
                <dt>Número de teléfono</dt>
                <dd>{usuario.telefono}</dd>
              </div>
              <div>
                <dt>Roles asignados</dt>
                <dd>{usuario.roles.length > 0 ? usuario.roles.map((rol) => rol.nombre).join(", ") : "Sin roles"}</dd>
              </div>
              <div>
                <dt>Fecha de ingreso</dt>
                <dd>{usuario.fechaIngreso}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd><EstadoRegistro estado={usuario.estado} /></dd>
              </div>
              <div>
                <dt>Términos y condiciones</dt>
                <dd>
                  {textoEstadoTerminos(estadoTerminos)}
                </dd>
              </div>
            </dl>
            {puedeModificar ? (
              <div className="form-actions">
                {usuario.estado === "activo" ? <BotonRestablecerContrasena correo={usuario.correo} usuarioId={usuario.id} /> : null}
                <Link className="primary-button" href={"/usuarios/" + usuario.id + "/editar"}>
                  Modificar
                </Link>
              </div>
            ) : null}
          </section>

          <OrdenesAsociadas
            activoId=""
            clienteId=""
            tecnicoId={String(usuario.id)}
            titulo="Actividad: órdenes de trabajo asignadas"
          />
        </div>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del usuario solicitado.</p>
      )}
    </main>
  );
}
