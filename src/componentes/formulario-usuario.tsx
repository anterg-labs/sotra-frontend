"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { ActualizarUsuarioInput, CrearUsuarioInput, Rol, Usuario } from "@/tipos/usuario";
import { validarUsuario } from "@/validaciones/usuario";

type PropiedadesFormularioUsuario = {
  usuarioInicial?: ActualizarUsuarioInput;
  etiquetaConfirmacion: string;
  rutaCancelar: string;
  rutaExito: string;
  roles?: Rol[];
  /** Server Action que guarda el usuario (alta o modificación). */
  accion: (usuario: CrearUsuarioInput) => Promise<ResultadoGuardar<Usuario>>;
  /** Si se informa, el formulario no navega: avisa al guardar (por ejemplo, para cerrar un modal). */
  alGuardar?: (resultado: Usuario) => void;
  alCancelar?: () => void;
};

/** Aviso del alta: la contraseña la elige el usuario con el enlace que Keycloak le manda por correo. */
export function mensajeUsuarioCreado(usuario: Pick<Usuario, "correo">) {
  return "Usuario creado. Se envió un correo a " + usuario.correo + " para que elija su contraseña.";
}

export function FormularioUsuario(props: PropiedadesFormularioUsuario) {
  const { usuarioInicial, roles, accion, alGuardar, alCancelar, etiquetaConfirmacion, rutaCancelar, rutaExito } = props;

  const enrutador = useRouter();
  const { mostrarAviso } = useAvisos();
  const [nombre, setNombre] = useState(usuarioInicial?.nombre ?? "");
  const [apellido, setApellido] = useState(usuarioInicial?.apellido ?? "");
  const [correo, setCorreo] = useState(usuarioInicial?.correo ?? "");
  const [telefono, setTelefono] = useState(usuarioInicial?.telefono ?? "");
  const [idsRolSeleccionados, setIdsRolSeleccionados] = useState<number[]>(usuarioInicial?.idsRol ?? []);

  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: (datos: CrearUsuarioInput) => validarUsuario(datos),
    accion,
    alExito: (usuario: Usuario) => {
      if (alGuardar) {
        alGuardar(usuario);
      } else {
        mostrarAviso("exito", usuarioInicial ? "Usuario actualizado." : mensajeUsuarioCreado(usuario));
        enrutador.push(rutaExito);
      }
    },
    mensajeGeneral: "No se pudo guardar la información del usuario.",
  });

  function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({ nombre, apellido, correo, telefono, idsRol: idsRolSeleccionados });
  }

  function mostrarError(campo: string, mensaje?: string) {
    if (!mensaje) return null;
    return (
      <p className="field-error" id={campo + "-error"} role="alert">
        {mensaje}
      </p>
    );
  }

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner" ref={referenciaErrorGeneral} role="alert" tabIndex={-1}>{errorGeneral}</p>;
  }

  let campoRol = null;
  if (roles) {
    campoRol = (
      <fieldset className="roles-usuario" id="roles">
        <legend>Roles</legend>
        <div className="roles-usuario-opciones">
          {roles.map((rol) => (
            <label className="rol-usuario-opcion" key={rol.id}>
              <input
                checked={idsRolSeleccionados.includes(rol.id)}
                onChange={(evento) => {
                  const estaMarcado = evento.target.checked;
                  setIdsRolSeleccionados((actuales) => estaMarcado ? [...actuales, rol.id] : actuales.filter((id) => id !== rol.id));
                }}
                type="checkbox"
              />
              <span>{rol.nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  let textoBoton = etiquetaConfirmacion;
  if (estaEnviando) {
    textoBoton = "Guardando…";
  }

  return (
    <form aria-busy={estaEnviando} noValidate onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nombre">Nombre</label>
          <input
            aria-describedby={errores.nombre ? "nombre-error" : undefined}
            aria-invalid={errores.nombre ? true : undefined}
            id="nombre"
            onChange={(evento) => setNombre(evento.target.value)}
            required
            type="text"
            value={nombre}
          />
          {mostrarError("nombre", errores.nombre)}
        </div>

        <div className="form-field">
          <label htmlFor="apellido">Apellido</label>
          <input
            aria-describedby={errores.apellido ? "apellido-error" : undefined}
            aria-invalid={errores.apellido ? true : undefined}
            id="apellido"
            onChange={(evento) => setApellido(evento.target.value)}
            required
            type="text"
            value={apellido}
          />
          {mostrarError("apellido", errores.apellido)}
        </div>

        <div className="form-field">
          <label htmlFor="correo">Correo electrónico</label>
          <input
            aria-describedby={errores.correo ? "correo-error" : undefined}
            aria-invalid={errores.correo ? true : undefined}
            id="correo"
            onChange={(evento) => setCorreo(evento.target.value)}
            required
            type="email"
            value={correo}
          />
          {mostrarError("correo", errores.correo)}
        </div>

        <div className="form-field">
          <label htmlFor="telefono">Número de teléfono</label>
          <input
            aria-describedby={errores.telefono ? "telefono-error" : undefined}
            aria-invalid={errores.telefono ? true : undefined}
            id="telefono"
            inputMode="numeric"
            onChange={(evento) => setTelefono(evento.target.value)}
            required
            type="tel"
            value={telefono}
          />
          {mostrarError("telefono", errores.telefono)}
        </div>

        {campoRol}

      </div>

      {usuarioInicial ? null : (
        <p className="page-description">
          La contraseña no se carga acá: al crear el usuario le llega un correo para que elija la suya.
        </p>
      )}

      <div className="form-actions">
        {alCancelar ? (
          <button className="secondary-button" onClick={alCancelar} type="button">
            Cancelar
          </button>
        ) : (
          <Link className="secondary-button" href={rutaCancelar}>
            Cancelar
          </Link>
        )}
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
