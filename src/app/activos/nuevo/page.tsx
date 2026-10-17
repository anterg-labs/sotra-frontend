import { AltaActivo } from "@/componentes/alta-activo";
import { listarClientesServidor } from "@/servicios/servidor/clientes";
import { listarModelosMaquinaServidor } from "@/servicios/servidor/modelos-maquina";

export default async function PaginaNuevoActivo() {
  const [clientes, modelosMaquina] = await Promise.all([
    listarClientesServidor({ buscar: "", estado: "activo", pagina: 1 }).then((pagina) => pagina.elementos).catch(() => null),
    listarModelosMaquinaServidor({ buscar: "", tipoMaquinaId: "", estado: "activo", pagina: 1 })
      .then((pagina) => pagina.elementos)
      .catch(() => null),
  ]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de activos</p>
          <h1>Registrar nuevo activo</h1>
        </div>
      </header>

      <section className="panel form-panel">
        <AltaActivo clientes={clientes} modelosMaquina={modelosMaquina} />
      </section>
    </main>
  );
}
