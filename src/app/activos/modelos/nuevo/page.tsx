import { AltaModeloMaquina } from "@/componentes/alta-modelo-maquina";
import { listarTiposMaquinaServidor } from "@/servicios/servidor/tipos-maquina";

export default async function PaginaNuevoModeloMaquina() {
  const tiposMaquina = await listarTiposMaquinaServidor({ buscar: "", estado: "activo", pagina: 1 })
    .then((pagina) => pagina.elementos)
    .catch(() => null);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de modelos de máquina</p>
          <h1>Registrar nuevo modelo de máquina</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <AltaModeloMaquina tiposMaquina={tiposMaquina} />
      </section>
    </main>
  );
}
