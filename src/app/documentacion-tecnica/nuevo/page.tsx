import { FormularioDocumentoTecnico } from "@/componentes/formulario-documento-tecnico";
import { listarActivosServidor } from "@/servicios/servidor/activos";

export default async function PaginaNuevoDocumentoTecnico() {
  const activos = await listarActivosServidor({ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "activo", pagina: 1 })
    .then((pagina) => pagina.elementos)
    .catch(() => null);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Documentación técnica</p>
          <h1>Cargar documento técnico</h1>
        </div>
      </header>

      <section className="panel form-panel">
        {activos === null ? (
          <p className="form-error-banner">No se pudo obtener el listado de activos.</p>
        ) : (
          <FormularioDocumentoTecnico activos={activos} />
        )}
      </section>
    </main>
  );
}
