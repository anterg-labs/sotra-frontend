import Image from "next/image";
import type { ReactNode } from "react";

export default function LayoutLogin({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="grid place-items-center px-4 py-8 sm:px-10">
        {children}
      </div>
      <aside className="relative hidden overflow-hidden bg-[#111113] lg:block">
        <Image
          alt=""
          className="object-cover opacity-70"
          fill
          priority
          sizes="50vw"
          src="/images/login-maquinaria.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <span className="mb-4 block h-1 w-16 bg-[#d71920]" />
          <p className="text-3xl font-semibold leading-tight">
            Construimos sueños,
            <br />
            construimos caminos.
          </p>
          <p className="mt-3 max-w-md text-sm text-white/80">
            SOTRA · Sistema de postventa de CVM, representante oficial de SANY
            en Uruguay.
          </p>
        </div>
      </aside>
    </main>
  );
}
