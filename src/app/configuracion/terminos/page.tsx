import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { obtenerTerminosVigentesServidor } from "@/servicios/servidor/terminos";
import type { TerminosCondiciones } from "@/tipos/terminos";
import { FormularioTerminos } from "./formulario-terminos";

async function cargarVigente(): Promise<{ vigente: TerminosCondiciones | null; error: string }> {
  try {
    return { vigente: await obtenerTerminosVigentesServidor(), error: "" };
  } catch (error) {
    // Sin versión publicada todavía (404) el formulario arranca vacío; otro fallo se avisa.
    const noHayVersion = error instanceof ErrorDeApi && error.estadoHttp === 404;
    return { vigente: null, error: noHayVersion ? "" : "No se pudo obtener el texto vigente; el formulario quedó vacío." };
  }
}

export default async function PaginaConfiguracionTerminos() {
  const { vigente, error } = await cargarVigente();

  return (
    <main className="page-content configuracion-terminos">
      <header className="page-heading terminos-cabecera">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1>Términos y condiciones</h1>
          <p className="terminos-bajada">Editá el texto y revisá cómo se verá antes de guardar.</p>
        </div>
      </header>

      <div className="terminos-espacio-trabajo">
        <section aria-label="Edición de términos">
          {error ? <p className="form-error-banner" role="alert">{error}</p> : null}
          <FormularioTerminos inicial={vigente} key={vigente ? vigente.id + ":" + vigente.version : "sin-vigente"} />
        </section>

      </div>
    </main>
  );
}
