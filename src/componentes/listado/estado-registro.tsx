export function EstadoRegistro(props: { estado: "activo" | "inactivo" }) {
  const estaActivo = props.estado === "activo";
  return <span className={estaActivo ? "status status-activo" : "status status-inactivo"}>{estaActivo ? "Activo" : "Inactivo"}</span>;
}
