import Link from "next/link";

export const metadata = { title: "Sin conexión" };

export default function PaginaSinConexion() {
  return (
    <main className="page-content">
      <section className="panel pagina-estado" role="status">
        <p className="eyebrow">Sin conexión</p>
        <h1>No hay conexión a internet</h1>
        <p>SOTRA necesita conexión para mostrar y guardar las órdenes. Revisá tu señal o tu WiFi y volvé a intentar.</p>
        <Link className="primary-button" href="/tecnico" prefetch={false}>
          Reintentar
        </Link>
      </section>
    </main>
  );
}
