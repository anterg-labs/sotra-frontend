"use client";

import { useEffect, useState } from "react";
import { FormularioDocumentoTecnico } from "@/componentes/formulario-documento-tecnico";
import { listarActivos } from "@/servicios/servicio-activos";
import { crearDocumentoTecnico } from "@/servicios/servicio-documentos-tecnicos";
import type { Activo } from "@/tipos/activo";

export default function PaginaNuevoDocumentoTecnico() {
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarActivos() {
      try {
        const activosObtenidos = await listarActivos();
        setActivos(activosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de activos.");
      }
    }

    cargarActivos();
  }, []);

  let contenidoFormulario = null;
  if (activos === null && !errorCarga) {
    contenidoFormulario = <p className="empty-state">Cargando activos…</p>;
  }

  if (errorCarga) {
    contenidoFormulario = <p className="form-error-banner">{errorCarga}</p>;
  }

  if (activos !== null) {
    contenidoFormulario = <FormularioDocumentoTecnico activos={activos} alEnviar={crearDocumentoTecnico} />;
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Documentación técnica</p>
          <h1>Cargar documento técnico</h1>
        </div>
      </header>

      <section className="panel form-panel">
        {contenidoFormulario}
      </section>
    </main>
  );
}
