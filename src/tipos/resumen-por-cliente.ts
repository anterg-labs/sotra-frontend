export type ClienteDeReportes = {
  clienteId: number;
  cliente: string;
  ordenes: number;
  correctivas: number;
  correctivasCerradas: number;
  horasParada: number;
  reincidencias: number;
};

export type ResumenPorCliente = {
  fechaDesde: string | null;
  fechaHasta: string | null;
  diasReincidencia: number;
  clientes: ClienteDeReportes[];
};
