export interface Movimiento {
  id?: number;
  cuentaCodigo: string;
  terceroRut?: string | null;
  centroCostoId?: number | null;
  debe: number;
  haber: number;
  glosaLinea: string;
  siiTipoDte?: number | null;
  siiFolioDoc?: number | null;
}

export interface Comprobante {
  id?: number;
  empresaRut: string;
  tipo: 'INGRESO' | 'EGRESO' | 'TRASPASO';
  fecha: string; // YYYY-MM-DD
  glosaGeneral: string;
  periodoMes: number;
  periodoAnio: number;
  movimientos: Movimiento[];
  totales?: {
    debe: number;
    haber: number;
    cuadrado: boolean;
  };
}
