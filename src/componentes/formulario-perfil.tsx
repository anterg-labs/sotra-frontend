"use client";

import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { Usuario } from "@/tipos/usuario";
import { validarNombrePersona, validarTelefono } from "@/validaciones/usuario";

type DatosPerfil = { nombre: string; apellido: string; telefono: string };

type PropiedadesFormularioPerfil = {
  perfil: Pick<Usuario, "nombre" | "apellido" | "telefono" | "correo">;
  accion: (datos: DatosPerfil) => Promise<ResultadoGuardar<Usuario>>;
};

function validar(datos: DatosPerfil) {
  const errores: Partial<Record<keyof DatosPerfil, string>> = {};
  const nombre = validarNombrePersona(datos.nombre, "Nombre");
  const apellido = validarNombrePersona(datos.apellido, "Apellido");
  const telefono = validarTelefono(datos.telefono);
  if (nombre) errores.nombre = nombre;
  if (apellido) errores.apellido = apellido;
  if (telefono) errores.telefono = telefono;
  return errores;
}

const AVISO_KEYCLOAK = "Depende de la integración con Keycloak";

/** «Mi perfil» (RF001-04): se guardan nombre, apellido y teléfono; correo y contraseña dependen de Keycloak. */
export function FormularioPerfil(props: PropiedadesFormularioPerfil) {
  const { mostrarAviso } = useAvisos();
  const [nombre, setNombre] = useState(props.perfil.nombre);
  const [apellido, setApellido] = useState(props.perfil.apellido);
  const [telefono, setTelefono] = useState(props.perfil.telefono);
  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar,
    accion: props.accion,
    alExito: () => mostrarAviso("exito", "Perfil actualizado."),
    mensajeGeneral: "No se pudo actualizar tu perfil.",
  });

  function campo(id: keyof DatosPerfil, etiqueta: string, valor: string, cambiar: (valor: string) => void) {
    return (
      <div className="form-field">
        <label htmlFor={id}>{etiqueta}</label>
        <input
          aria-describedby={errores[id] ? id + "-error" : undefined}
          aria-invalid={errores[id] ? true : undefined}
          autoComplete={id === "telefono" ? "tel" : id === "nombre" ? "given-name" : "family-name"}
          id={id}
          onChange={(evento) => cambiar(evento.target.value)}
          type="text"
          value={valor}
        />
        {errores[id] ? <p className="field-error" id={id + "-error"} role="alert">{errores[id]}</p> : null}
      </div>
    );
  }

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        enviar({ nombre, apellido, telefono });
      }}
    >
      {errorGeneral ? <div className="form-error-banner" ref={referenciaErrorGeneral} role="alert" tabIndex={-1}>{errorGeneral}</div> : null}
      <div className="form-grid">
        {campo("nombre", "Nombre", nombre, setNombre)}
        {campo("apellido", "Apellido", apellido, setApellido)}
        {campo("telefono", "Número de teléfono o celular", telefono, setTelefono)}
      </div>

      <fieldset className="perfil-keycloak">
        <legend>Acceso a la cuenta</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="correoPerfil">Correo electrónico</label>
            <input disabled id="correoPerfil" readOnly type="email" value={props.perfil.correo} />
            <p className="texto-tenue text-xs">{AVISO_KEYCLOAK}: se cambia desde la administración de usuarios.</p>
          </div>
          <div className="form-field">
            <label htmlFor="contrasenaPerfil">Contraseña</label>
            <input disabled id="contrasenaPerfil" readOnly type="password" value="••••••••••" />
            <p className="texto-tenue text-xs">{AVISO_KEYCLOAK}: el cambio de contraseña está pendiente de integrar.</p>
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {estaEnviando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
