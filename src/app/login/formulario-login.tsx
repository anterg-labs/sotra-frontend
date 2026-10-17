"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

const claseCampo =
  "mt-1 w-full rounded-lg border border-slate-400 bg-white px-3 py-2.5 text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365f7a]";

/** Pantalla solo visual: no valida credenciales; la autenticación real la integra Keycloak. */
export function FormularioLogin() {
  const enrutador = useRouter();

  function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enrutador.push("/");
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
        Iniciar sesión
      </h1>
      <p className="mt-1 text-center text-sm text-slate-600">
        Ingresa a SOTRA con tu cuenta.
      </p>

      <form className="mt-6 space-y-4" onSubmit={entrar}>
        <label className="block text-sm font-medium text-slate-800">
          Usuario
          <input
            autoComplete="username"
            className={claseCampo}
            name="usuario"
            type="text"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Contraseña
          <input
            autoComplete="current-password"
            className={claseCampo}
            name="contrasena"
            type="password"
          />
        </label>
        <div className="text-right text-sm">
          <Link className="text-link" href="/login/recuperar">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <button
          className="w-full rounded-lg bg-[#365f7a] px-4 py-2.5 font-medium text-white hover:bg-[#294b64] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365f7a]"
          type="submit"
        >
          Entrar
        </button>
      </form>
    </section>
  );
}
