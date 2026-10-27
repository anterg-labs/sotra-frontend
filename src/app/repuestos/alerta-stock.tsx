"use client";

import Link from "next/link";
import { InsigniaStock } from "@/componentes/indicador-stock";
import { useNavegacionListado } from "@/componentes/listado/navegacion-listado";
import type { AlertasStock, Repuesto } from "@/tipos/repuesto";
import { construirUrlRepuestos } from "./filtros";

const CANTIDAD_DE_AVISOS_VISIBLES = 5;

/** Aviso de stock insuficiente con los repuestos más críticos y el acceso directo al filtro «Con alerta». */
export function AlertaStock(props: { alertas: AlertasStock; repuestos: Repuesto[] }) {
  const { alertas, repuestos } = props;
  const { navegar } = useNavegacionListado();

  if (alertas.total === 0) return null;

  const resumen = [
    alertas.sinStock > 0 ? alertas.sinStock + " sin stock" : "",
    alertas.bajo > 0 ? alertas.bajo + " con stock bajo" : "",
  ].filter(Boolean).join(" y ");

  return (
    <section aria-label="Alerta de stock insuficiente" className={"aviso-stock" + (alertas.sinStock > 0 ? " aviso-stock-critico" : "")} role="status">
      <h2>{"Stock insuficiente (" + alertas.total + ")"}</h2>
      <p className="mt-1 text-sm">{resumen + ". Revisalos o registrá un ingreso."}</p>
      <ul>
        {repuestos.slice(0, CANTIDAD_DE_AVISOS_VISIBLES).map((repuesto) => (
          <li key={repuesto.id}>
            <span>
              <strong>{repuesto.codigo}</strong>
              {" · " + repuesto.nombre + " · " + repuesto.cantidad + " de mín. " + repuesto.cantidadMinima + (repuesto.ubicacion ? " · " + repuesto.ubicacion : "")}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <InsigniaStock estadoStock={repuesto.estadoStock} />
              <Link className="secondary-button" href={"/repuestos/" + repuesto.id}>
                Ver detalle
              </Link>
              <Link className="primary-button" href={"/repuestos/" + repuesto.id + "?ingresar=1"}>
                Ingresar stock
              </Link>
            </span>
          </li>
        ))}
      </ul>
      {alertas.total > CANTIDAD_DE_AVISOS_VISIBLES ? (
        <button
          className="text-link mt-3 inline-flex min-h-6 items-center"
          onClick={() => navegar(construirUrlRepuestos({ buscar: "", estado: "", ubicacion: "", stock: "alerta", pagina: 1 }))}
          type="button"
        >
          {"Ver los " + alertas.total + " repuestos con alerta"}
        </button>
      ) : null}
    </section>
  );
}
