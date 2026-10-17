import Link from "next/link";

export default function PaginaNoEncontrada() {
  return (
    <main className="page-content">
      <section className="panel pagina-estado">
        <p className="eyebrow">Error 404</p>
        <h1>No encontramos esta página</h1>
        <p>La dirección no existe o el contenido fue movido. Volvé al inicio para seguir trabajando.</p>
        <Link className="primary-button" href="/reportes">
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}
