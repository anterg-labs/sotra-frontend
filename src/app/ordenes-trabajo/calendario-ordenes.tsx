"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useEstadosOrden, etiquetaLegible } from "@/componentes/estados-orden";
import { IconoLapiz, IconoOjo } from "@/componentes/iconos";
import { IndicadorNavegacion } from "@/componentes/indicador-navegacion";
import { Modal } from "@/componentes/modal";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { apiObtenerCalendarioOrdenes, apiObtenerOrdenTrabajo } from "@/servicios/api/api-ordenes-trabajo";
import type { CalendarioOrden, FiltrosOrdenesTrabajo } from "@/tipos/orden-trabajo";
import { DIAS_DE_LA_SEMANA, esMesValido, mesDeHoy, nombreDelMes, primerDiaDelMes, semanasDelMes, sumarMeses, ultimoDiaDelMes } from "@/utilidades/calendario";
import { DetalleOrdenTrabajo } from "./[id]/detalle-orden";

const TARJETAS_VISIBLES_POR_DIA = 3;

function nivelDeCarga(cantidad: number, maximo: number) {
  if (cantidad === 0 || maximo === 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((cantidad / maximo) * 4)));
}

function DetalleEnModal({ ordenId }: { ordenId: number }) {
  const orden = useDatos(() => apiObtenerOrdenTrabajo(ordenId), "orden-" + ordenId);
  return (
    <BloqueDeDatos cargando="Cargando la orden…" {...orden}>
      {(datos) => <DetalleOrdenTrabajo enModal huboErrorTecnicos={false} ordenInicial={datos} tecnicosIniciales={[]} />}
    </BloqueDeDatos>
  );
}

type PropiedadesTarjeta = { orden: CalendarioOrden; alVer: (id: number) => void };

function TarjetaDeOrden({ orden, alVer }: PropiedadesTarjeta) {
  const estados = useEstadosOrden();
  const tono = estados.find((estado) => estado.valor === orden.estado)?.tono ?? "neutro";
  const etiquetaEstado = estados.find((estado) => estado.valor === orden.estado)?.etiqueta ?? etiquetaLegible(orden.estado);
  const editable = orden.fase !== "cerrada" && orden.fase !== "eliminada";
  return (
    <li className={"calendario-tarjeta calendario-tono-" + tono + (orden.vencida ? " calendario-tarjeta-vencida" : "")}>
      <button
        aria-label={`Orden ${orden.id}, ${orden.nombreActivo}, ${etiquetaEstado}${orden.vencida ? ", vencida" : ""}. Ver detalle`}
        className="calendario-tarjeta-titulo"
        onClick={() => alVer(orden.id)}
        type="button"
      >
        <span aria-hidden="true" className={"calendario-tipo calendario-tipo-" + orden.tipo} title={orden.tipo}>{orden.tipo === "preventivo" ? "P" : "C"}</span>
        <span className="calendario-tarjeta-texto">
          <strong>{"N° " + orden.id}</strong> {orden.nombreActivo}
        </span>
      </button>
      <span className="calendario-acciones">
        <button aria-label={`Ver detalle de la orden ${orden.id}`} className="boton-icono" onClick={() => alVer(orden.id)} title="Ver detalle" type="button">
          <IconoOjo />
        </button>
        {editable ? (
          <SiTienePermiso permiso="ot.editar">
            <Link aria-label={`Modificar la orden ${orden.id}`} className="boton-icono" href={"/ordenes-trabajo/" + orden.id + "/editar"} title="Modificar orden">
              <IconoLapiz />
              <IndicadorNavegacion destino="el formulario de la orden" />
            </Link>
          </SiTienePermiso>
        ) : null}
      </span>
    </li>
  );
}

type PropiedadesCalendario = { filtros: FiltrosOrdenesTrabajo };

/**
 * Vista de calendario de las órdenes: cada orden aparece en su fecha prevista de ejecución, con los mismos filtros del
 * listado. Se pueden ver de uno a tres meses a la vez; el día se tiñe más cuanto más órdenes tiene; la leyenda y el
 * contador de vencidas filtran; y el detalle se abre en un modal encima del calendario.
 */
export function CalendarioOrdenes({ filtros }: PropiedadesCalendario) {
  const estados = useEstadosOrden();
  const [mesInicial, setMesInicial] = useState(() => (filtros.mes && esMesValido(filtros.mes) ? filtros.mes : mesDeHoy()));
  const [cantidadDeMeses, setCantidadDeMeses] = useState(() => Math.min(3, Math.max(1, Number(filtros.meses) || 1)));
  const [conEliminadas, setConEliminadas] = useState(filtros.eliminadas === true);
  const [soloEstado, setSoloEstado] = useState("");
  const [soloVencidas, setSoloVencidas] = useState(false);
  const [diasAbiertos, setDiasAbiertos] = useState<Set<string>>(new Set());
  const [ordenVista, setOrdenVista] = useState<number | null>(null);
  const hoy = new Date().toISOString().slice(0, 10);

  const meses = useMemo(() => Array.from({ length: cantidadDeMeses }, (_, indice) => sumarMeses(mesInicial, indice)), [mesInicial, cantidadDeMeses]);
  const desde = primerDiaDelMes(meses[0]);
  const hasta = ultimoDiaDelMes(meses[meses.length - 1]);
  const clave = JSON.stringify({ desde, hasta, conEliminadas, c: filtros.clienteId, a: filtros.activoId, e: filtros.estado, t: filtros.tipo, p: filtros.prioridad, sinAsignar: filtros.sinAsignar });
  const calendario = useDatos(
    () =>
      apiObtenerCalendarioOrdenes({
        desde, hasta, clienteId: filtros.clienteId, activoId: filtros.activoId, estado: filtros.estado,
        tipo: filtros.tipo, prioridad: filtros.prioridad, incluirEliminadas: conEliminadas, sinAsignar: filtros.sinAsignar,
      }),
    clave,
  );

  // El mes visible, la cantidad de meses y las eliminadas viajan en la dirección para poder compartirla.
  useEffect(() => {
    const direccion = new URL(window.location.href);
    direccion.searchParams.set("mes", mesInicial);
    if (cantidadDeMeses > 1) direccion.searchParams.set("meses", String(cantidadDeMeses));
    else direccion.searchParams.delete("meses");
    if (conEliminadas) direccion.searchParams.set("eliminadas", "true");
    else direccion.searchParams.delete("eliminadas");
    window.history.replaceState(window.history.state, "", direccion);
  }, [mesInicial, cantidadDeMeses, conEliminadas]);

  function alternarDia(dia: string) {
    setDiasAbiertos((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(dia)) siguientes.delete(dia);
      else siguientes.add(dia);
      return siguientes;
    });
  }

  return (
    <section aria-label="Calendario de órdenes de trabajo" className="calendario panel">
      <div className="calendario-barra">
        <div className="calendario-navegacion">
          <button aria-label="Mes anterior" className="secondary-button" onClick={() => setMesInicial(sumarMeses(mesInicial, -1))} type="button">‹</button>
          <button className="secondary-button" onClick={() => setMesInicial(mesDeHoy())} type="button">Hoy</button>
          <button aria-label="Mes siguiente" className="secondary-button" onClick={() => setMesInicial(sumarMeses(mesInicial, 1))} type="button">›</button>
          <h2 aria-live="polite" className="calendario-titulo">
            {cantidadDeMeses === 1 ? nombreDelMes(meses[0]) : nombreDelMes(meses[0]) + " – " + nombreDelMes(meses[meses.length - 1])}
          </h2>
        </div>
        <div className="calendario-opciones">
          <div className="form-field">
            <label htmlFor="mesesVisibles">Meses a la vez</label>
            <select id="mesesVisibles" onChange={(evento) => setCantidadDeMeses(Number(evento.target.value))} value={cantidadDeMeses}>
              <option value={1}>1 mes</option>
              <option value={2}>2 meses</option>
              <option value={3}>3 meses</option>
            </select>
          </div>
          <label className="calendario-casilla">
            <input checked={conEliminadas} onChange={(evento) => setConEliminadas(evento.target.checked)} type="checkbox" />
            Mostrar eliminadas
          </label>
        </div>
      </div>

      <BloqueDeDatos cargando="Cargando el calendario…" {...calendario}>
        {(datos) => {
          const visibles = datos.elementos.filter(
            (orden) => (soloEstado === "" || orden.estado === soloEstado) && (!soloVencidas || orden.vencida),
          );
          const porDia = new Map<string, CalendarioOrden[]>();
          for (const orden of visibles) porDia.set(orden.fecha, [...(porDia.get(orden.fecha) ?? []), orden]);
          const maximoPorDia = Math.max(0, ...[...porDia.values()].map((lista) => lista.length));
          const vencidas = datos.elementos.filter((orden) => orden.vencida).length;
          const estadosPresentes = estados.filter((estado) => datos.elementos.some((orden) => orden.estado === estado.valor));

          return (
            <>
              {datos.truncado ? <p className="form-error-banner" role="status">Hay más órdenes que las que se pueden mostrar: acotá los filtros o el período.</p> : null}
              <div className="calendario-leyenda">
                <span className="texto-tenue">Estados:</span>
                {estadosPresentes.map((estado) => (
                  <button
                    aria-pressed={soloEstado === estado.valor}
                    className={"calendario-chip calendario-tono-" + estado.tono + (soloEstado === estado.valor ? " calendario-chip-activo" : "")}
                    key={estado.valor}
                    onClick={() => setSoloEstado(soloEstado === estado.valor ? "" : estado.valor)}
                    type="button"
                  >
                    {estado.etiqueta}
                  </button>
                ))}
                <button aria-pressed={soloVencidas} className={"calendario-chip calendario-chip-vencidas" + (soloVencidas ? " calendario-chip-activo" : "")} onClick={() => setSoloVencidas(!soloVencidas)} type="button">
                  {vencidas + (vencidas === 1 ? " vencida" : " vencidas")}
                </button>
              </div>

              <div className="calendario-meses">
                {meses.map((mes) => (
                  <table className="calendario-mes" key={mes}>
                    <caption>{nombreDelMes(mes)}</caption>
                    <thead>
                      <tr>{DIAS_DE_LA_SEMANA.map((dia) => <th key={dia} scope="col">{dia}</th>)}</tr>
                    </thead>
                    <tbody>
                      {semanasDelMes(mes).map((semana, indice) => (
                        <tr key={indice}>
                          {semana.map((dia, columna) => {
                            if (dia === null) return <td className="calendario-dia calendario-dia-vacio" key={columna} />;
                            const ordenes = porDia.get(dia) ?? [];
                            const abierto = diasAbiertos.has(dia);
                            const mostradas = abierto ? ordenes : ordenes.slice(0, TARJETAS_VISIBLES_POR_DIA);
                            return (
                              <td
                                className={"calendario-dia calendario-carga-" + nivelDeCarga(ordenes.length, maximoPorDia) + (dia === hoy ? " calendario-dia-hoy" : "")}
                                key={dia}
                              >
                                <span className="calendario-numero">
                                  {Number(dia.slice(8))}
                                  {ordenes.length > 0 ? <span className="sr-only">{", " + ordenes.length + (ordenes.length === 1 ? " orden" : " órdenes")}</span> : null}
                                </span>
                                <ul className="calendario-lista">
                                  {mostradas.map((orden) => <TarjetaDeOrden alVer={setOrdenVista} key={orden.id} orden={orden} />)}
                                </ul>
                                {ordenes.length > TARJETAS_VISIBLES_POR_DIA ? (
                                  <button aria-expanded={abierto} className="boton-texto" onClick={() => alternarDia(dia)} type="button">
                                    {abierto ? "Ver menos" : "+" + (ordenes.length - TARJETAS_VISIBLES_POR_DIA) + " más"}
                                  </button>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ))}
              </div>
              {visibles.length === 0 ? <p className="empty-state">No hay órdenes con fecha prevista en este período.</p> : null}
            </>
          );
        }}
      </BloqueDeDatos>

      <Modal
        alCerrar={() => {
          setOrdenVista(null);
          calendario.reintentar();
        }}
        descripcion="Órdenes de trabajo"
        estaAbierto={ordenVista !== null}
        tamano="amplio"
        titulo={ordenVista === null ? "Orden de trabajo" : "Orden de trabajo N° " + ordenVista}
      >
        {ordenVista !== null ? <DetalleEnModal ordenId={ordenVista} /> : null}
      </Modal>
    </section>
  );
}
