"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

/** Pantalla solo visual: no envía ningún correo. */
export function FormularioRecuperar() {
  const [estaEnviado, setEstaEnviado] = useState(false);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviado(true);
  }

  return (
    <section className="w-full max-w-sm">
      <Image
        alt="CVM"
        className="mx-auto h-auto w-40"
        height={152}
        priority
        src="/images/logo-cvm.png"
        width={717}
      />
      <h1 className="mt-6 text-center text-xl font-semibold text-slate-800">
        Recuperar contraseña
      </h1>

      {estaEnviado ? (
        <p
          className="mt-4 rounded-lg bg-green-100 p-3 text-sm text-green-800"
          role="status"
        >
          Si el correo corresponde a una cuenta, te enviaremos un enlace para
          restablecer la contraseña.
        </p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={enviar}>
          <p className="text-sm text-slate-600">
            Ingresa tu correo y te enviaremos un enlace para restablecerla.
          </p>
          <label className="block text-sm font-medium text-slate-800">
            Correo electrónico
            <input
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-400 bg-white px-3 py-2.5 text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365f7a]"
              name="correo"
              type="email"
            />
          </label>
          <button
            className="w-full rounded-lg bg-[#365f7a] px-4 py-2.5 font-medium text-white hover:bg-[#294b64] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365f7a]"
            type="submit"
          >
            Enviar enlace
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link className="text-link" href="/login">
          Volver a iniciar sesión
        </Link>
      </p>
    </section>
  );
}
