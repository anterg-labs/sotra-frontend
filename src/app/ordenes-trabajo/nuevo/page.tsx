"use client";

import { useEffect, useState } from "react";
import { FormularioOrdenTrabajo } from "@/componentes/formulario-orden-trabajo";
import { listarActivos } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import { crearOrdenTrabajo, listarTecnicos } from "@/servicios/servicio-ordenes-trabajo";
import { listarRepuestos } from "@/servicios/servicio-repuestos";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { Repuesto } from "@/tipos/repuesto";
import type { Usuario } from "@/tipos/usuario";

export default function PaginaNuevaOrdenTrabajo() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [tecnicos, setTecnicos] = useState<Usuario[] | null>(null);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarDatosFormulario() {
      try {
        const clientesObtenidos = await listarClientes();
        const activosObtenidos = await listarActivos();
        const tecnicosObtenidos = await listarTecnicos();
        const repuestosObtenidos = await listarRepuestos();
        setClientes(clientesObtenidos);
        setActivos(activosObtenidos);
        setTecnicos(tecnicosObtenidos);
        setRepuestos(repuestosObtenidos);
      } catch {
        setErrorCarga("No se pudieron obtener los datos necesarios para crear la orden.");
      }
    }

    cargarDatosFormulario();
  }, []);

  let contenidoFormulario = null;
  if ((clientes === null || activos === null || tecnicos === null) && !errorCarga) {
    contenidoFormulario = <p className="empty-state">Cargando datos…</p>;
  }

  if (errorCarga) {
    contenidoFormulario = <p className="form-error-banner">{errorCarga}</p>;
  }

  if (clientes !== null && activos !== null && tecnicos !== null) {
    contenidoFormulario = (
      <FormularioOrdenTrabajo
        activos={activos}
        alEnviar={crearOrdenTrabajo}
        clientes={clientes}
        etiquetaConfirmacion="Confirmar creación"
        repuestos={repuestos}
        tecnicos={tecnicos}
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Órdenes de trabajo</p>
          <h1>Crear orden de trabajo</h1>
        </div>
      </header>

      <section className="panel form-panel">
        {contenidoFormulario}
      </section>
    </main>
  );
}
