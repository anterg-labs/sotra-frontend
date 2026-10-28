import { FormularioUmbralesEtapa } from "./formulario-umbrales-etapa";

export const metadata = { title: "Demoras por etapa" };

export default function PaginaUmbralesEtapa() {
  return <main className="page-content"><header className="page-heading"><div>
    <p className="eyebrow">Configuración</p><h1>Demoras por etapa</h1>
    <p className="texto-tenue">Definí una referencia de duración por etapa. Dejar el campo vacío utiliza el promedio histórico de las etapas terminadas. No hay máximos fijos; cero es válido.</p>
  </div></header><FormularioUmbralesEtapa /></main>;
}
