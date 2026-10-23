import Link from "next/link";
import { MENSAJE_SIN_PERMISO } from "@/servicios/api/solicitudes-http";

export const metadata = { title: "Sin permiso" };

/** El proxy muestra esta pantalla (con estado 403) cuando el rol del usuario no alcanza para la página pedida. */
export default function PaginaSinPermiso() {
  return (
    <main className="page-content">
      <section className="panel pagina-estado" role="alert">
        <p className="eyebrow">Error 403</p>
        <h1>{MENSAJE_SIN_PERMISO}</h1>
        <p>Si necesitás acceder a esta sección, pedíselo al administrador.</p>
        <Link className="primary-button" href="/">
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}
