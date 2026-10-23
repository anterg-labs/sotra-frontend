"use client";

import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import type { AlertasStock } from "@/tipos/repuesto";
import { construirUrlRepuestos, type FiltroStock, type FiltrosUrlRepuestos } from "./filtros";

type ValoresRepuestos = Omit<FiltrosUrlRepuestos, "pagina">;
const VACIOS: ValoresRepuestos = { buscar: "", estado: "", ubicacion: "", stock: "" };

const chipsStock: { valor: FiltroStock; etiqueta: string }[] = [
  { valor: "", etiqueta: "Todos" },
  { valor: "alerta", etiqueta: "Con alerta" },
  { valor: "bajo", etiqueta: "Stock bajo" },
  { valor: "sin_stock", etiqueta: "Sin stock" },
];

function contadorDelChip(valor: FiltroStock, alertas: AlertasStock | null) {
  if (alertas === null) return undefined;
  if (valor === "alerta") return alertas.total;
  if (valor === "bajo") return alertas.bajo;
  if (valor === "sin_stock") return alertas.sinStock;
  return undefined;
}

/** Chips de estado de stock (con contadores) y filtros de texto, todos en vivo: el texto espera un instante y lo demás aplica al instante. */
export function BarraFiltrosRepuestos(props: { filtros: FiltrosUrlRepuestos; alertas: AlertasStock | null }) {
  const { filtros, alertas } = props;
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresRepuestos>({
    inicial: { buscar: filtros.buscar, estado: filtros.estado, ubicacion: filtros.ubicacion, stock: filtros.stock, ordenarPor: filtros.ordenarPor, direccionOrden: filtros.direccionOrden },
    construirUrl: (v) => construirUrlRepuestos({ ...v, pagina: 1 }),
  });

  return (
    <>
      <div aria-label="Filtro por estado de stock" className="chips-filtro" role="group">
        {chipsStock.map((chip) => {
          const contador = contadorDelChip(chip.valor, alertas);
          return (
            <button
              aria-pressed={valores.stock === chip.valor}
              className="chip-filtro"
              key={chip.valor}
              onClick={() => cambiar({ stock: chip.valor })}
              type="button"
            >
              {chip.etiqueta}
              {contador !== undefined ? <span className="chip-filtro-contador">{contador}</span> : null}
            </button>
          );
        })}
      </div>

      <form
        aria-busy={estaPendiente}
        aria-label="Búsqueda y filtros"
        className="barra-filtros"
        onSubmit={(evento) => {
          evento.preventDefault();
          aplicarAhora();
        }}
      >
        <div className="form-field campo-busqueda">
          <label htmlFor="buscarRepuesto">Buscar</label>
          <input
            id="buscarRepuesto"
            onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
            placeholder="Código, nombre, marca o descripción"
            type="text"
            value={valores.buscar}
          />
        </div>
        <div className="form-field">
          <label htmlFor="ubicacionRepuestoFiltro">Ubicación</label>
          <input
            id="ubicacionRepuestoFiltro"
            onChange={(evento) => cambiar({ ubicacion: evento.target.value }, true)}
            type="text"
            value={valores.ubicacion}
          />
        </div>
        <div className="form-field">
          <label htmlFor="estadoRepuestoFiltro">Estado</label>
          <select id="estadoRepuestoFiltro" onChange={(evento) => cambiar({ estado: evento.target.value })} value={valores.estado}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div className="barra-filtros-acciones">
          <button className="secondary-button" onClick={() => limpiar(VACIOS)} type="button">
            Limpiar filtros
          </button>
        </div>
      </form>
    </>
  );
}
