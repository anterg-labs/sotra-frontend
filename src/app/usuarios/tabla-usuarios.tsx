"use client";

import Link from "next/link";
import { useState } from "react";
import { IconoLapiz, IconoOjo, IconoPapelera } from "@/componentes/iconos";
import { EstadoRegistro } from "@/componentes/listado/estado-registro";
import { useUltimoCreado } from "@/componentes/listado/ultimo-creado";
import { useCambioEstado } from "@/componentes/listado/use-cambio-estado";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import type { UsuarioListado } from "@/tipos/usuario";
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
export function TablaUsuarios(props: { usuarios: UsuarioListado[] }) {
  const [usuarioPendienteBaja, setUsuarioPendienteBaja] = useState<UsuarioListado | null>(null);
  const { enProcesoId, error, ejecutar } = useCambioEstado(cambiarEstadoUsuarioAccion, () => setUsuarioPendienteBaja(null));
  const nuevoId = useUltimoCreado("usuarios");

  return (
    <>
      {error ? <p className="form-error-banner">{error}</p> : null}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre y apellido</th>
              <th>Correo electrónico</th>
              <th>Roles asignados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {props.usuarios.map((usuario) => {
              const estaOcupado = enProcesoId === usuario.id;
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
                      <Link
                        aria-label="Modificar usuario"
                        className="boton-icono"
                        href={"/usuarios/" + usuario.id + "/editar"}
                        title="Modificar usuario"
                      >
                        <IconoLapiz />
                      </Link>
                      {usuario.estado === "activo" ? (
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
