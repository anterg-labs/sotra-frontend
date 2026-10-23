"use client";

import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { construirUrlUsuarios } from "./filtros";

import Link from "next/link";
import { useState } from "react";
import { IconoLapiz, IconoOjo, IconoPapelera } from "@/componentes/iconos";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstado } from "@/componentes/listado/use-cambio-estado";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { esUsuarioAdministrador } from "@/seguridad/permisos";
import type { UsuarioListado, FiltrosUsuarios } from "@/tipos/usuario";
import { cambiarEstadoUsuarioAccion } from "./acciones";

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

/** Tabla del listado: recibe los usuarios ya cargados en el servidor y maneja la baja con confirmación. */
export function TablaUsuarios(props: { usuarios: UsuarioListado[]; filtros?: FiltrosUsuarios }) {
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlUsuarios({ ...filtros, ...orden, pagina: 1 } as FiltrosUsuarios)}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const [usuarioPendienteBaja, setUsuarioPendienteBaja] = useState<UsuarioListado | null>(null);
  const { enProcesoId, error, ejecutar } = useCambioEstado(cambiarEstadoUsuarioAccion, () => setUsuarioPendienteBaja(null));
  const nuevoId = useUltimoCreado("usuarios");
  // El jefe ve a los administradores, pero no los modifica ni los da de baja.
  const puedeGestionarAdministradores = useTienePermiso("usuario.gestionar_administradores");

  return (
    <>
      {error ? <p className="form-error-banner">{error}</p> : null}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columna("nombre", "Nombre y apellido")}
              {columna("correo", "Correo electrónico")}
              {columna("roles", "Roles asignados")}
              {columna("estado", "Estado")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {props.usuarios.map((usuario) => {
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
                          onClick={() => setUsuarioPendienteBaja(usuario)}
                          title="Dar de baja"
                          type="button"
                        >
                          <IconoPapelera />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {usuarioPendienteBaja ? (
        <ModalConfirmacion
          descripcion={
            "¿Confirmás la desactivación de " +
            usuarioPendienteBaja.nombre +
            " " +
            usuarioPendienteBaja.apellido +
            "? Ya no podrá iniciar sesión mientras permanezca inactivo."
          }
          estaConfirmando={enProcesoId === usuarioPendienteBaja.id}
          etiquetaConfirmar="Dar de baja"
          onCancelar={() => setUsuarioPendienteBaja(null)}
          onConfirmar={() => ejecutar(usuarioPendienteBaja.id, "inactivo")}
          titulo="Desactivar usuario"
        />
      ) : null}
    </>
  );
}
