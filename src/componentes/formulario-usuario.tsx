"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActualizarUsuarioInput, CrearUsuarioInput, Rol, Usuario } from "@/tipos/usuario";

type PropiedadesFormularioUsuario = {
  roles: Rol[];
  usuarioInicial?: ActualizarUsuarioInput;
  solicitarContrasenaTemporal?: boolean;
  etiquetaConfirmacion: string;
  rutaCancelar: string;
  rutaExito: string;
  alEnviar: (usuario: CrearUsuarioInput) => Promise<Usuario>;
};

export function FormularioUsuario(props: PropiedadesFormularioUsuario) {
  const roles = props.roles;
  const usuarioInicial = props.usuarioInicial;
  let solicitarContrasenaTemporal = props.solicitarContrasenaTemporal;
  if (solicitarContrasenaTemporal === undefined) {
    solicitarContrasenaTemporal = false;
  }
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const rutaCancelar = props.rutaCancelar;
  const rutaExito = props.rutaExito;
  const alEnviar = props.alEnviar;

  let nombreInicial = "";
  let apellidoInicial = "";
  let correoInicial = "";
  let telefonoInicial = "";
  let rolIdInicial = roles[0].id;
  if (usuarioInicial) {
    nombreInicial = usuarioInicial.nombre;
    apellidoInicial = usuarioInicial.apellido;
    correoInicial = usuarioInicial.correo;
    telefonoInicial = usuarioInicial.telefono;
    rolIdInicial = usuarioInicial.rolId;
  }

  const enrutador = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [apellido, setApellido] = useState(apellidoInicial);
  const [correo, setCorreo] = useState(correoInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [contrasenaTemporal, setContrasenaTemporal] = useState("");
  const [rolId, setRolId] = useState(rolIdInicial);
  const [errorGeneral, setErrorGeneral] = useState("");
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

  function cambiarContrasenaTemporal(evento: React.ChangeEvent<HTMLInputElement>) {
    setContrasenaTemporal(evento.target.value);
  }

  function cambiarRolId(evento: React.ChangeEvent<HTMLSelectElement>) {
    setRolId(Number(evento.target.value));
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");
    setEstaEnviando(true);

    const usuarioParaGuardar: CrearUsuarioInput = {
      nombre,
      apellido,
      correo,
      telefono,
      contrasenaTemporal,
      rolId,
    };

    try {
      await alEnviar(usuarioParaGuardar);
      enrutador.push(rutaExito);
    } catch {
      setErrorGeneral("No se pudo guardar la información del usuario.");
    } finally {
      setEstaEnviando(false);
    }
  }

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner !mx-0 !mt-0 !mb-5">{errorGeneral}</p>;
  }

  let campoContrasenaTemporal = null;
  if (solicitarContrasenaTemporal) {
    campoContrasenaTemporal = (
      <div className="form-field">
        <label htmlFor="contrasenaTemporal">Contraseña temporal</label>
        <input
          id="contrasenaTemporal"
          onChange={cambiarContrasenaTemporal}
          required
          type="password"
          value={contrasenaTemporal}
        />
      </div>
    );
  }

  let textoBoton = etiquetaConfirmacion;
  if (estaEnviando) {
    textoBoton = "Guardando…";
  }

  return (
    <form onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" onChange={cambiarNombre} required type="text" value={nombre} />
        </div>

        <div className="form-field">
          <label htmlFor="apellido">Apellido</label>
          <input id="apellido" onChange={cambiarApellido} required type="text" value={apellido} />
        </div>

        <div className="form-field">
          <label htmlFor="correo">Correo electrónico</label>
          <input id="correo" onChange={cambiarCorreo} required type="email" value={correo} />
        </div>

        <div className="form-field">
          <label htmlFor="telefono">Número de teléfono</label>
          <input id="telefono" onChange={cambiarTelefono} required type="tel" value={telefono} />
        </div>

        {campoContrasenaTemporal}

        <div className="form-field">
          <label htmlFor="rolId">Rol del usuario</label>
          <select id="rolId" onChange={cambiarRolId} required value={rolId}>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>
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
