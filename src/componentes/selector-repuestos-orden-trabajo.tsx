import { ComboboxMultiple } from "@/componentes/combobox-multiple";
import { listarRepuestosPaginados } from "@/servicios/servicio-repuestos";
import type { Repuesto } from "@/tipos/repuesto";

type PropiedadesSelectorRepuestosOrdenTrabajo = {
  repuestos: Repuesto[];
  idsRepuestos: number[];
  alCambiarIdsRepuestos: (idsRepuestos: number[]) => void;
};

export function SelectorRepuestosOrdenTrabajo(props: PropiedadesSelectorRepuestosOrdenTrabajo) {
  const opciones = props.repuestos
    .filter((repuesto) => repuesto.estado === "activo" || props.idsRepuestos.includes(repuesto.id))
    .map((repuesto) => ({ valor: String(repuesto.id), etiqueta: `${repuesto.codigo} - ${repuesto.nombre}` }));

  return (
    <ComboboxMultiple
      alCambiar={(valores) => props.alCambiarIdsRepuestos(valores.map(Number))}
      buscarOpciones={async (consulta) => {
        const pagina = await listarRepuestosPaginados({ buscar: consulta, estado: "activo", ubicacion: "", bajoStock: false, pagina: 1 });
        return pagina.elementos.map((repuesto) => ({ valor: String(repuesto.id), etiqueta: `${repuesto.codigo} - ${repuesto.nombre}` }));
      }}
      etiqueta="Repuestos"
      id="repuestos-orden"
      opciones={opciones}
      textoVacio="Buscar repuestos"
      valores={props.idsRepuestos.map(String)}
    />
  );
}
