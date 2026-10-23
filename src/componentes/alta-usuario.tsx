"use client";

import { FormularioUsuario } from "@/componentes/formulario-usuario";
import { crearUsuarioAccion } from "@/app/usuarios/acciones";
import type { Rol, Usuario } from "@/tipos/usuario";

type PropiedadesAltaUsuario = {
  /** Roles cargados en el servidor; `null` si no se pudieron obtener. */
  roles: Rol[] | null;
  alGuardar?: (usuario: Usuario) => void;
  alCancelar?: () => void;
};

/** Formulario de alta de usuario con los roles ya cargados, en una página o dentro de un modal. */
export function AltaUsuario(props: PropiedadesAltaUsuario) {
  if (props.roles === null) {
    return <p className="form-error-banner">No se pudo obtener el listado de roles.</p>;
  }

  if (props.roles.length === 0) {
    return <p className="empty-state">No hay roles disponibles.</p>;
  }

  return (
    <FormularioUsuario
      accion={crearUsuarioAccion}
      alCancelar={props.alCancelar}
      alGuardar={props.alGuardar}
      etiquetaConfirmacion="Confirmar creación"
      roles={props.roles}
      rutaCancelar="/usuarios"
      rutaExito="/usuarios"
    />
  );
}
