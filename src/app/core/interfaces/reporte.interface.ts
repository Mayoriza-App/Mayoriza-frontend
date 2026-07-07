import { TipoCuenta } from './contabilidad.interface';



export interface CuentaBalance {
  cuentaCodigo: string;
  cuentaNombre: string;
  tipo: TipoCuenta;
  totalDebe: number;
  totalHaber: number;
  saldoDeudor: number;
  saldoAcreedor: number;
  activo: number;
  pasivo: number;
  perdida: number;
  ganancia: number;
}

export interface BalanceGeneral {
  empresaRut: string;
  periodoAnio: number;
  periodoMes?: number;
  cuentas: CuentaBalance[];
  totales: {
    debe: number;
    haber: number;
    saldoDeudor: number;
    saldoAcreedor: number;
    activos: number;
    pasivos: number;
    resultadoPerdida: number;
    resultadoGanancia: number;
    utilidadDelEjercicio: number;
  };
}

export interface BorradorF29 {
  empresaRut: string;
  periodoAnio: number;
  periodoMes: number;
  totalIvaDebito: number;
  totalIvaCredito: number;
  totalRetencionHonorarios: number;
  ivaAPagar: number;
}
