"use client";

import { Combobox } from "@/componentes/combobox";
import { FiltroFecha, rangoDeFechasInvalido } from "@/componentes/filtro-fecha";
import { useFiltrosEnVivo } from "@/componentes/listado/use-filtros-en-vivo";
import { listarRepuestosPaginados } from "@/servicios/servicio-repuestos";
import { listarUsuariosPaginados } from "@/servicios/servicio-usuarios";
import type { FiltrosMovimientosStock } from "@/tipos/movimiento-stock";
import type { Repuesto } from "@/tipos/repuesto";
import type { Usuario } from "@/tipos/usuario";
import { construirUrlMovimientos } from "./filtros";

type ValoresMovimientos = Omit<FiltrosMovimientosStock, "pagina">;
const VACIOS: ValoresMovimientos = { buscar: "", repuestoId: "", tipo: "", fechaDesde: "", fechaHasta: "", ubicacion: "", usuarioId: "" };

/**
 * Filtros del listado en vivo: el texto (búsqueda y ubicación) espera un instante y lo demás aplica al instante.
 * Con un rango de fechas invertido no se consulta: el error queda junto al campo y el foco en la fecha final.
 */
export function BarraFiltrosMovimientos(props: {
  filtros: FiltrosMovimientosStock;
  repuestos: Repuesto[];
  usuarios: Usuario[];
  /** Sin permiso para listar usuarios (pañolero) no se muestra el filtro por usuario responsable. */
  puedeFiltrarPorUsuario?: boolean;
}) {
  const { filtros } = props;
  const { valores, cambiar, aplicarAhora, limpiar, estaPendiente } = useFiltrosEnVivo<ValoresMovimientos>({
    inicial: {
      buscar: filtros.buscar,
      repuestoId: filtros.repuestoId,
      tipo: filtros.tipo,
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      ubicacion: filtros.ubicacion,
      usuarioId: filtros.usuarioId,
      ordenarPor: filtros.ordenarPor,
      direccionOrden: filtros.direccionOrden,
    },
    construirUrl: (v) => construirUrlMovimientos({ ...v, pagina: 1 }),
    sonValidos: (v) => !rangoDeFechasInvalido(v.fechaDesde, v.fechaHasta),
    alInvalido: () => document.getElementById("fechaMovimiento-hasta")?.focus(),
  });

  return (
    <form
      aria-busy={estaPendiente}
      aria-label="Búsqueda y filtros"
      className="barra-filtros"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        aplicarAhora();
      }}
    >
      <div className="form-field campo-busqueda">
        <label htmlFor="buscarMovimiento">Buscar</label>
        <input
          id="buscarMovimiento"
          onChange={(evento) => cambiar({ buscar: evento.target.value }, true)}
          placeholder="Código o nombre del repuesto, o motivo"
          type="text"
          value={valores.buscar}
        />
      </div>
      <Combobox
        alCambiar={(repuestoId) => cambiar({ repuestoId })}
        buscarOpciones={async (consulta) => {
          const pagina = await listarRepuestosPaginados({ buscar: consulta, estado: "", ubicacion: "", bajoStock: false, pagina: 1 });
          return pagina.elementos.map((repuesto) => ({ valor: String(repuesto.id), etiqueta: `${repuesto.codigo} - ${repuesto.nombre}` }));
        }}
        etiqueta="Repuesto"
        id="repuestoMovimiento"
        opciones={props.repuestos.map((repuesto) => ({ valor: String(repuesto.id), etiqueta: `${repuesto.codigo} - ${repuesto.nombre}` }))}
        textoVacio="Todos los repuestos"
        valor={valores.repuestoId}
      />
      <div className="form-field">
        <label htmlFor="tipoMovimiento">Tipo de movimiento</label>
        <select id="tipoMovimiento" onChange={(evento) => cambiar({ tipo: evento.target.value })} value={valores.tipo}>
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
          <option value="ajuste">Ajuste</option>
        </select>
      </div>
      {props.puedeFiltrarPorUsuario ?? true ? (
        <Combobox
          alCambiar={(usuarioId) => cambiar({ usuarioId })}
          buscarOpciones={async (consulta) => {
            const pagina = await listarUsuariosPaginados({ buscar: consulta, rolId: "", estado: "", pagina: 1 });
            return pagina.elementos.map((usuario) => ({ valor: String(usuario.id), etiqueta: `${usuario.nombre} ${usuario.apellido}` }));
          }}
          etiqueta="Usuario responsable"
          id="usuarioMovimiento"
          opciones={props.usuarios.map((usuario) => ({ valor: String(usuario.id), etiqueta: `${usuario.nombre} ${usuario.apellido}` }))}
          textoVacio="Todos los usuarios"
          valor={valores.usuarioId}
        />
      ) : null}
      <div className="form-field">
        <label htmlFor="ubicacionMovimiento">Ubicación o depósito</label>
        <input
          id="ubicacionMovimiento"
          onChange={(evento) => cambiar({ ubicacion: evento.target.value }, true)}
          type="text"
          value={valores.ubicacion}
        />
      </div>
      <FiltroFecha
        alCambiar={(fechaDesde, fechaHasta) => cambiar({ fechaDesde, fechaHasta })}
        etiqueta="Fecha"
        fechaDesde={valores.fechaDesde}
        fechaHasta={valores.fechaHasta}
        id="fechaMovimiento"
      />
      <div className="barra-filtros-acciones">
        <button className="secondary-button" onClick={() => limpiar(VACIOS)} type="button">
          Limpiar filtros
        </button>
      </div>
    </form>
  );
}
