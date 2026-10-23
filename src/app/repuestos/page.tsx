import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { listarRepuestosServidor, obtenerAlertasStockServidor } from "@/servicios/servidor/repuestos";
import type { AlertasStock, Repuesto } from "@/tipos/repuesto";
import { AltaRepuesto } from "./alta-repuesto";
import { IngresoRapidoStock } from "./ingreso-rapido-stock";
import { AlertaStock } from "./alerta-stock";
import { BarraFiltrosRepuestos } from "./barra-filtros-repuestos";
import { aFiltrosApiRepuestos, leerFiltrosRepuestos } from "./filtros";
import { ListadoRepuestos } from "./listado-repuestos";

const ETIQUETA_CARGA = "Cargando repuestos…";

/** Contadores y repuestos críticos; si fallan, el listado sigue funcionando sin el aviso. */
async function cargarAlertas(): Promise<{ alertas: AlertasStock | null; repuestos: Repuesto[] }> {
  try {
    const [alertas, pagina] = await Promise.all([
      obtenerAlertasStockServidor(),
      listarRepuestosServidor({
        buscar: "", estado: "activo", ubicacion: "", bajoStock: true, estadoStock: "", orden: "criticidad", pagina: 1,
      }),
    ]);
    return { alertas, repuestos: pagina.elementos };
  } catch {
    return { alertas: null, repuestos: [] };
  }
}

export default async function PaginaRepuestos(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosRepuestos(await props.searchParams);
  const consulta = anticiparConsulta(listarRepuestosServidor(aFiltrosApiRepuestos(filtros)));
  const { alertas, repuestos } = await cargarAlertas();

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Repuestos</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="secondary-button" href="/repuestos/movimientos">
            Movimientos de stock
          </Link>
          <IngresoRapidoStock />
          <AltaRepuesto />
        </div>
      </header>

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        {alertas !== null ? <AlertaStock alertas={alertas} repuestos={repuestos} /> : null}

        <BarraFiltrosRepuestos alertas={alertas} filtros={filtros} />

        <section className="panel">
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />}>
              <ListadoRepuestos consulta={consulta} filtros={filtros} />
            </Suspense>
          </ZonaListado>
        </section>
      </ProveedorNavegacionListado>
    </main>
  );
}
