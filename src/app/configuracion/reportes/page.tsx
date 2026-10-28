import Link from "next/link";
import { notFound } from "next/navigation";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import { obtenerVisibilidadReportesServidor } from "@/servicios/servidor/visibilidad-reportes";
import { PanelVisibilidadReportes } from "./panel-visibilidad-reportes";

export const metadata = { title: "Configuración de Reportes" };

export default async function PaginaConfiguracionReportes() {
  if (!(await tienePermisoServidor("configuracion.gestionar"))) notFound();
  let visibilidad;
  try { visibilidad = await obtenerVisibilidadReportesServidor(); }
  catch { visibilidad = null; }
  return <main className="page-content">
    <header className="page-heading"><div>
      <p className="eyebrow">Configuración</p>
      <h1>Reportes</h1>
      <p className="texto-tenue">Elegí qué indicadores, gráficas y reportes aparecen en Reportes.</p>
    </div></header>
    <div className="reportes-config-enlaces">
      <Link className="secondary-button" href="/configuracion/avisos">Configurar reglas de avisos</Link>
      <Link className="secondary-button" href="/configuracion/demoras-etapas">Configurar demoras por etapa</Link>
    </div>
    {visibilidad ? <PanelVisibilidadReportes inicial={visibilidad} />
      : <p className="form-error-banner" role="alert">No se pudo obtener la configuración de Reportes. Recargá la página para reintentar.</p>}
  </main>;
}
