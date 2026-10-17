import { listarActivosServidor } from "@/servicios/servidor/activos";
import { listarClientesServidor } from "@/servicios/servidor/clientes";
import { listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { listarRepuestosServidor } from "@/servicios/servidor/repuestos";
import { FormularioNuevaOrden } from "../formularios-orden";

async function cargarDatos() {
  try {
    const [clientes, activos, tecnicos, repuestos] = await Promise.all([
      listarClientesServidor({ buscar: "", estado: "activo", pagina: 1 }),
      listarActivosServidor({ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "activo", pagina: 1 }),
      listarTecnicosServidor(),
      listarRepuestosServidor({ buscar: "", estado: "activo", ubicacion: "", bajoStock: false, pagina: 1 }),
    ]);
    return { clientes: clientes.elementos, activos: activos.elementos, tecnicos, repuestos: repuestos.elementos };
  } catch {
    return null;
  }
}

export default async function PaginaNuevaOrdenTrabajo() {
  const datos = await cargarDatos();

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Órdenes de trabajo</p>
          <h1>Crear orden de trabajo</h1>
        </div>
      </header>

      <section className="panel form-panel">
        {datos === null ? (
          <p className="form-error-banner">No se pudieron obtener los datos necesarios para crear la orden.</p>
        ) : (
          <FormularioNuevaOrden {...datos} />
        )}
      </section>
    </main>
  );
}
