import Image from "next/image";
import { redirect } from "next/navigation";
import { obtenerTokenAcceso } from "@/servicios/servidor/token-acceso";

export const metadata = { title: "Iniciar sesión" };

/**
 * Pantalla de error del inicio de sesión (Auth.js `pages.error`). El caso más común es volver con «Atrás» a la
 * pantalla de login de Keycloak después de haber entrado: Keycloak reutiliza la sesión y el regreso trae un pedido
 * de login ya usado. Si la sesión sigue vigente, no hay nada que mostrar: se vuelve al inicio.
 */
export default async function PaginaErrorInicioSesion() {
  if (await obtenerTokenAcceso()) redirect("/");

  return (
    <main className="page-content">
      <section className="panel pagina-estado" role="alert">
        <Image alt="CVM" className="h-auto w-24" height={152} priority src="/images/logo-cvm.png" width={717} />
        <p className="eyebrow">Iniciar sesión</p>
        <h1>No se pudo completar el inicio de sesión</h1>
        <p>Puede pasar si la pantalla de ingreso quedó abierta mucho tiempo o si volviste a ella con «Atrás». Intentá de nuevo.</p>
        <a className="primary-button" href="/login">
          Volver a iniciar sesión
        </a>
      </section>
    </main>
  );
}
