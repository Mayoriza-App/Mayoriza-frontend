export type TipoCuenta = 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'RESULTADO_PERDIDA' | 'RESULTADO_GANANCIA';

export interface CuentaContable {
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  empresaRut?: string;
}

export interface CentroCosto {
  id: number;
  nombre: string;
}

export interface Tercero {
  rut: string;
  razonSocial: string;
  giro?: string;
}
