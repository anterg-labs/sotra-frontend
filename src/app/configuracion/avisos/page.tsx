import { listarReglasAvisoServidor } from "@/servicios/servidor/reportes";
import type { ReglaAviso } from "@/tipos/reporte";
import { FormularioReglasAviso } from "./formulario-reglas-aviso";

export const metadata = { title: "Avisos de ineficiencia" };

async function cargarReglas(): Promise<{ reglas: ReglaAviso[]; error: string }> {
  try {
    return { reglas: await listarReglasAvisoServidor(), error: "" };
  } catch {
    return { reglas: [], error: "No se pudieron obtener las reglas de aviso." };
  }
}

export default async function PaginaConfiguracionAvisos() {
  const { reglas, error } = await cargarReglas();
  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1>Avisos de ineficiencia</h1>
          <p className="texto-tenue">
            Cada regla compara un cálculo sobre las órdenes, la maquinaria y los repuestos con un umbral. Los umbrales no tienen límites fijos:
            ajustalos a la realidad de la empresa.
          </p>
        </div>
      </header>
      {error ? <p className="form-error-banner" role="alert">{error}</p> : <FormularioReglasAviso reglas={reglas} />}
    </main>
  );
}
