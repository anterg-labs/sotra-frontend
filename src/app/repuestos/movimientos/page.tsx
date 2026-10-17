import { listarMovimientosStockServidor } from "@/servicios/servidor/movimientos-stock";
import { anticiparConsulta } from "@/servicios/servidor/consulta-anticipada";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoListado } from "@/componentes/listado/esqueleto-listado";
import { ProveedorNavegacionListado, ZonaListado } from "@/componentes/listado/navegacion-listado";
import type { ParametrosBusqueda } from "@/componentes/listado/url-listado";
import { conSeleccionado } from "@/servicios/servidor/opciones";
import { listarRepuestosServidor, obtenerRepuestoServidor } from "@/servicios/servidor/repuestos";
import { listarUsuariosServidor, obtenerUsuarioServidor } from "@/servicios/servidor/usuarios";
import type { Repuesto } from "@/tipos/repuesto";
import type { Usuario } from "@/tipos/usuario";
import { BarraFiltrosMovimientos } from "./barra-filtros-movimientos";
import { leerFiltrosMovimientos } from "./filtros";
import { ListadoMovimientos } from "./listado-movimientos";

const ETIQUETA_CARGA = "Cargando movimientos de stock…";

export default async function PaginaMovimientosStock(props: { searchParams: Promise<ParametrosBusqueda> }) {
  const filtros = leerFiltrosMovimientos(await props.searchParams);
  const consulta = anticiparConsulta(listarMovimientosStockServidor(filtros));
  const clave = Object.values(filtros).join("|");

  const [repuestos, usuarios] = await Promise.all([
    listarRepuestosServidor({ buscar: "", estado: "", ubicacion: "", bajoStock: false, pagina: 1 })
      .then((pagina) => conSeleccionado<Repuesto>(pagina.elementos, filtros.repuestoId, obtenerRepuestoServidor))
      .catch(() => [] as Repuesto[]),
    listarUsuariosServidor({ buscar: "", rolId: "", estado: "", pagina: 1 })
      .then((pagina) => conSeleccionado<Usuario>(pagina.elementos, filtros.usuarioId, obtenerUsuarioServidor))
      .catch(() => [] as Usuario[]),
  ]);

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Repuestos</p>
          <h1>Movimientos de stock</h1>
        </div>
        <Link className="secondary-button" href="/repuestos">
          Volver a repuestos
        </Link>
      </header>

      <ProveedorNavegacionListado etiquetaCarga={ETIQUETA_CARGA}>
        <BarraFiltrosMovimientos filtros={filtros} repuestos={repuestos} usuarios={usuarios} />

        <section className="panel">
          <ZonaListado>
            <Suspense fallback={<EsqueletoListado etiqueta={ETIQUETA_CARGA} />} key={clave}>
              <ListadoMovimientos consulta={consulta} filtros={filtros} />
            </Suspense>
          </ZonaListado>
        </section>
      </ProveedorNavegacionListado>
    </main>
  );
}
