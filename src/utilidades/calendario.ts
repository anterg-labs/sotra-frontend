/** Cálculos de calendario con fechas ISO (`aaaa-mm-dd`) y meses `aaaa-mm`, siempre en UTC para no depender de la zona horaria. */

const FORMATO_MES = new Intl.DateTimeFormat("es-UY", { month: "long", year: "numeric", timeZone: "UTC" });

export const DIAS_DE_LA_SEMANA = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"] as const;

function dividir(mes: string) {
  const [anio, numero] = mes.split("-").map(Number);
  return { anio, indice: numero - 1 };
}

function aClave(anio: number, indice: number) {
  const fecha = new Date(Date.UTC(anio, indice, 1));
  return fecha.getUTCFullYear() + "-" + String(fecha.getUTCMonth() + 1).padStart(2, "0");
}

export function esMesValido(texto: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(texto);
}

export function mesDeHoy(hoy: Date = new Date()) {
  return aClave(hoy.getUTCFullYear(), hoy.getUTCMonth());
}

/** Mes que está `cantidad` meses después (o antes, si es negativa). */
export function sumarMeses(mes: string, cantidad: number) {
  const { anio, indice } = dividir(mes);
  return aClave(anio, indice + cantidad);
}

export function primerDiaDelMes(mes: string) {
  return mes + "-01";
}

export function ultimoDiaDelMes(mes: string) {
  const { anio, indice } = dividir(mes);
  return new Date(Date.UTC(anio, indice + 1, 0)).toISOString().slice(0, 10);
}

/** «noviembre de 2026». */
export function nombreDelMes(mes: string) {
  const { anio, indice } = dividir(mes);
  return FORMATO_MES.format(new Date(Date.UTC(anio, indice, 1)));
}

/** Semanas del mes (de lunes a domingo); los días que no son del mes quedan en `null`. */
export function semanasDelMes(mes: string): (string | null)[][] {
  const { anio, indice } = dividir(mes);
  const ultimo = new Date(Date.UTC(anio, indice + 1, 0)).getUTCDate();
  const primerDiaSemana = (new Date(Date.UTC(anio, indice, 1)).getUTCDay() + 6) % 7;
  const celdas: (string | null)[] = Array.from({ length: primerDiaSemana }, () => null);
  for (let dia = 1; dia <= ultimo; dia += 1) celdas.push(mes + "-" + String(dia).padStart(2, "0"));
  while (celdas.length % 7 !== 0) celdas.push(null);
  return Array.from({ length: celdas.length / 7 }, (_, semana) => celdas.slice(semana * 7, semana * 7 + 7));
}
