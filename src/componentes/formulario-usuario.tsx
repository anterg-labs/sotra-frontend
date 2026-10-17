"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActualizarUsuarioInput, CrearUsuarioInput, Rol, Usuario } from "@/tipos/usuario";
import { validarUsuario, type ErroresUsuario } from "@/validaciones/usuario";

type PropiedadesFormularioUsuario = {
  usuarioInicial?: ActualizarUsuarioInput;
  solicitarContrasena?: boolean;
  etiquetaConfirmacion: string;
  rutaCancelar: string;
  rutaExito: string;
  roles?: Rol[];
  alEnviar: (usuario: CrearUsuarioInput) => Promise<Usuario>;
};

export function FormularioUsuario(props: PropiedadesFormularioUsuario) {
  const usuarioInicial = props.usuarioInicial;
  const solicitarContrasena = props.solicitarContrasena ?? false;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const rutaCancelar = props.rutaCancelar;
  const rutaExito = props.rutaExito;
  const roles = props.roles;
  const alEnviar = props.alEnviar;

  let nombreInicial = "";
  let apellidoInicial = "";
  let correoInicial = "";
  let telefonoInicial = "";
  let idsRolIniciales: number[] = [];
  if (usuarioInicial) {
    nombreInicial = usuarioInicial.nombre;
    apellidoInicial = usuarioInicial.apellido;
    correoInicial = usuarioInicial.correo;
    telefonoInicial = usuarioInicial.telefono;
    idsRolIniciales = usuarioInicial.idsRol;
  }

  const enrutador = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [apellido, setApellido] = useState(apellidoInicial);
  const [correo, setCorreo] = useState(correoInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [contrasena, setContrasena] = useState("");
  const [idsRolSeleccionados, setIdsRolSeleccionados] = useState<number[]>(idsRolIniciales);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errores, setErrores] = useState<ErroresUsuario>({});
  const [estaEnviando, setEstaEnviando] = useState(false);

  function cambiarNombre(evento: React.ChangeEvent<HTMLInputElement>) {
    setNombre(evento.target.value);
  }

  function cambiarApellido(evento: React.ChangeEvent<HTMLInputElement>) {
    setApellido(evento.target.value);
  }

  function cambiarCorreo(evento: React.ChangeEvent<HTMLInputElement>) {
    setCorreo(evento.target.value);
  }

  function cambiarTelefono(evento: React.ChangeEvent<HTMLInputElement>) {
    setTelefono(evento.target.value);
  }

  function cambiarContrasena(evento: React.ChangeEvent<HTMLInputElement>) {
    setContrasena(evento.target.value);
  }

  function cambiarRol(evento: React.ChangeEvent<HTMLInputElement>) {
    const rolIdCambiado = Number(evento.target.value);
    const nuevosIdsRol: number[] = [];

    if (evento.target.checked) {
      for (const rolIdSeleccionado of idsRolSeleccionados) {
        nuevosIdsRol.push(rolIdSeleccionado);
      }
      nuevosIdsRol.push(rolIdCambiado);
    } else {
      for (const rolIdSeleccionado of idsRolSeleccionados) {
        if (rolIdSeleccionado !== rolIdCambiado) {
          nuevosIdsRol.push(rolIdSeleccionado);
        }
      }
    }

    setIdsRolSeleccionados(nuevosIdsRol);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");

    const erroresDetectados = validarUsuario(
      { nombre, apellido, correo, telefono, contrasena },
      { exigirContrasena: solicitarContrasena },
    );
    setErrores(erroresDetectados);
    if (Object.keys(erroresDetectados).length > 0) {
      return;
    }

    setEstaEnviando(true);

    const usuarioParaGuardar: CrearUsuarioInput = {
      nombre,
      apellido,
      correo,
      telefono,
      idsRol: idsRolSeleccionados,
      contrasena,
    };

    try {
      await alEnviar(usuarioParaGuardar);
      enrutador.push(rutaExito);
    } catch (error) {
      if (error instanceof Error) {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral("No se pudo guardar la información del usuario.");
      }
    } finally {
      setEstaEnviando(false);
    }
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
    mensajeError = <p className="form-error-banner">{errorGeneral}</p>;
  }

  let campoContrasena = null;
  if (solicitarContrasena) {
    campoContrasena = (
      <div className="form-field">
        <label htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          maxLength={255}
          aria-describedby={errores.contrasena ? "contrasena-error" : undefined}
          aria-invalid={errores.contrasena ? true : undefined}
          onChange={cambiarContrasena}
          required
          type="password"
          value={contrasena}
        />
        {mostrarError("contrasena", errores.contrasena)}
      </div>
    );
  }

  let campoRol = null;
  if (roles) {
    campoRol = (
      <div className="form-field">
        <label>Roles</label>
        {roles.map((rol) => (
          <div key={rol.id}>
            <input
              checked={idsRolSeleccionados.includes(rol.id)}
              id={"rol-" + rol.id}
              onChange={cambiarRol}
              type="checkbox"
              value={rol.id}
            />
            <label htmlFor={"rol-" + rol.id}> {rol.nombre}</label>
          </div>
        ))}
      </div>
    );
  }

  let textoBoton = etiquetaConfirmacion;
  if (estaEnviando) {
    textoBoton = "Guardando…";
  }

  return (
    <form noValidate onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nombre">Nombre</label>
          <input
            aria-describedby={errores.nombre ? "nombre-error" : undefined}
            aria-invalid={errores.nombre ? true : undefined}
            id="nombre"
            onChange={cambiarNombre}
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
            onChange={cambiarApellido}
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
            onChange={cambiarCorreo}
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
            onChange={cambiarTelefono}
            required
            type="tel"
            value={telefono}
          />
          {mostrarError("telefono", errores.telefono)}
        </div>

        {campoContrasena}
        {campoRol}

      </div>

      <div className="form-actions">
        <Link className="secondary-button" href={rutaCancelar}>
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
