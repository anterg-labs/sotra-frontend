"use client";

import Link from "next/link";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstadoConfirmado } from "@/componentes/listado/use-cambio-estado-confirmado";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { esUsuarioAdministrador } from "@/seguridad/permisos";
import type { UsuarioListado, FiltrosUsuarios } from "@/tipos/usuario";
import { cambiarEstadoUsuarioAccion } from "./acciones";
import { construirUrlUsuarios } from "./filtros";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";

function CeldaRoles(props: { roles: UsuarioListado["roles"] }) {
  const { roles } = props;
  if (roles.length === 0) return <span>Sin roles</span>;
  if (roles.length === 1) return <span>{roles[0].nombre}</span>;
  return (
    <details>
      <summary className="cursor-pointer">{roles.length} roles</summary>
      <ul>
        {roles.map((rol) => (
          <li key={rol.id}>{rol.nombre}</li>
        ))}
      </ul>
    </details>
  );
}

/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  nombre: (fila: UsuarioListado): ValorOrdenable => fila.nombre + " " + fila.apellido,
  correo: (fila: UsuarioListado): ValorOrdenable => fila.correo,
  roles: (fila: UsuarioListado): ValorOrdenable => fila.roles.map((rol) => rol.nombre).join(", "),
  cantidadOrdenesAsignadas: (fila: UsuarioListado): ValorOrdenable => fila.cantidadOrdenesAsignadas,
  estado: (fila: UsuarioListado): ValorOrdenable => fila.estado === "activo",
};

/** Tabla del listado: recibe los usuarios ya cargados en el servidor y maneja la baja y la reactivación, ambas con confirmación. */
export function TablaUsuarios(props: { usuarios: UsuarioListado[]; filtros: FiltrosUsuarios; unaSolaPagina?: boolean }) {
  const usuarios = useFilasConOrdenInstantaneo(props.usuarios, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlUsuarios({ ...filtros, ...orden, pagina: 1 })}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const { enProcesoId, pedirBaja, pedirReactivacion, modales } = useCambioEstadoConfirmado<UsuarioListado>(cambiarEstadoUsuarioAccion, {
    mensajeBaja: "Usuario dado de baja.",
    tituloBaja: "Desactivar usuario",
    descripcionBaja: (usuario) =>
      "¿Confirmás la desactivación de " + usuario.nombre + " " + usuario.apellido + "? Ya no podrá iniciar sesión mientras permanezca inactivo.",
    reactivacion: {
      mensaje: "Usuario reactivado.",
      titulo: "Reactivar usuario",
      descripcion: (usuario) =>
        "¿Confirmás la reactivación de " + usuario.nombre + " " + usuario.apellido + "? Podrá volver a iniciar sesión con sus datos y roles.",
    },
  });
  const nuevoId = useUltimoCreado("usuarios");
  // El jefe ve a los administradores, pero no los modifica ni los da de baja.
  const puedeGestionarAdministradores = useTienePermiso("usuario.gestionar_administradores");

  return (
    <>
      <ContenedorTabla etiqueta="Listado de usuarios">
        <table>
          <thead>
            <tr>
              {columna("nombre", "Nombre y apellido")}
              {columna("correo", "Correo electrónico")}
              {columna("roles", "Roles asignados")}
              {columna("cantidadOrdenesAsignadas", "Órdenes asignadas")}
              {columna("estado", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const estaOcupado = enProcesoId === usuario.id;
              const puedeModificar = puedeGestionarAdministradores || !esUsuarioAdministrador(usuario);
              return (
                <tr
                  aria-busy={estaOcupado || undefined}
                  className={[usuario.id === nuevoId ? "fila-nueva" : "", estaOcupado ? "opacity-60" : ""].join(" ").trim() || undefined}
                  key={usuario.id}
                >
                  <td>
                    <strong>{usuario.nombre} {usuario.apellido}</strong>
                  </td>
                  <td>{usuario.correo}</td>
                  <td><CeldaRoles roles={usuario.roles} /></td>
                  <td className="celda-numerica">
                    {usuario.cantidadOrdenesAsignadas > 0 ? (
                      <Link
                        aria-label={"Ver las " + usuario.cantidadOrdenesAsignadas + " órdenes activas asignadas a " + usuario.nombre}
                        className="text-link"
                        href={"/ordenes-trabajo?tecnicoId=" + usuario.id + "&soloActivas=true"}
                      >
                        {usuario.cantidadOrdenesAsignadas}
                      </Link>
                    ) : (
                      0
                    )}
                  </td>
                  <td><EstadoRegistro estado={usuario.estado} /></td>
                  <td>
                    <div className="table-actions">
                      <Link aria-label="Ver detalle" className="boton-icono" href={"/usuarios/" + usuario.id} title="Ver detalle">
                        <IconoOjo />
                      </Link>
                      {puedeModificar ? (
                        <Link
                          aria-label="Modificar usuario"
                          className="boton-icono"
                          href={"/usuarios/" + usuario.id + "/editar"}
                          title="Modificar usuario"
                        >
                          <IconoLapiz />
                        </Link>
                      ) : null}
                      {puedeModificar && usuario.estado === "activo" ? (
                        <button
                          aria-label="Dar de baja"
                          className="boton-icono boton-icono-peligro"
                          disabled={estaOcupado}
                          onClick={() => pedirBaja(usuario)}
                          title="Dar de baja"
                          type="button"
                        >
                          <IconoPapelera />
                        </button>
                      ) : (
                        <button
                          aria-label="Reactivar usuario"
                          className="boton-icono"
                          disabled={estaOcupado}
                          onClick={() => pedirReactivacion(usuario)}
                          title="Reactivar usuario"
                          type="button"
                        >
                          <IconoReactivar />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ContenedorTabla>


      {modales}
    </>
  );
}
