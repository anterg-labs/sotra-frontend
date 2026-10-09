"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormularioOrdenTrabajo } from "@/componentes/formulario-orden-trabajo";
import { listarActivos } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import {
  actualizarOrdenTrabajo,
  listarTecnicos,
  obtenerDetalleOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import { listarRepuestos } from "@/servicios/servicio-repuestos";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { CrearOrdenTrabajoInput, OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Repuesto } from "@/tipos/repuesto";
import type { Usuario } from "@/tipos/usuario";

export default function PaginaEditarOrdenTrabajo() {
  const parametros = useParams<{ id: string }>();
  const ordenTrabajoId = Number(parametros.id);
  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [tecnicos, setTecnicos] = useState<Usuario[] | null>(null);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarDatosFormulario() {
      try {
        const ordenObtenida = await obtenerDetalleOrdenTrabajo(ordenTrabajoId);
        const clientesObtenidos = await listarClientes();
        const activosObtenidos = await listarActivos();
        const tecnicosObtenidos = await listarTecnicos();
        const repuestosObtenidos = await listarRepuestos();
        setOrden(ordenObtenida);
        setClientes(clientesObtenidos);
        setActivos(activosObtenidos);
        setTecnicos(tecnicosObtenidos);
        setRepuestos(repuestosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener la información de la orden solicitada.");
      }
    }

    cargarDatosFormulario();
  }, [ordenTrabajoId]);

  function guardarOrden(camposOrden: CrearOrdenTrabajoInput) {
    return actualizarOrdenTrabajo(ordenTrabajoId, camposOrden);
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if ((!orden || !clientes || !activos || !tecnicos) && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información de la orden…</p>;
  }

  let formulario = null;
  if (orden && clientes && activos && tecnicos) {
    formulario = (
      <section className="panel form-panel">
        <FormularioOrdenTrabajo
          activos={activos}
          alEnviar={guardarOrden}
          clientes={clientes}
          etiquetaConfirmacion="Confirmar modificación"
          ordenInicial={orden}
          repuestos={repuestos}
          tecnicos={tecnicos}
        />
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Órdenes de trabajo</p>
          <h1>Modificar orden de trabajo</h1>
        </div>
      </header>

      {mensajeError}
      {mensajeCargando}
      {formulario}
    </main>
  );
}
