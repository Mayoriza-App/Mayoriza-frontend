import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BalanceGeneral, BorradorF29 } from '../interfaces/reporte.interface';
import * as XLSX from 'xlsx';

export interface CuentaBalanceDto {
  cuentaCodigo: string;
  cuentaNombre: string;
  tipo: string;
  totalDebe: number;
  totalHaber: number;
  saldoDeudor: number;
  saldoAcreedor: number;
  activo: number;
  pasivo: number;
  perdida: number;
  ganancia: number;
}

export interface LibroMayorLineaDto {
  fecha: string;
  comprobanteId: number;
  comprobanteTipo: string;
  glosaLinea: string | null;
  debe: number;
  haber: number;
  saldoAcumulado: number;
  terceroRut?: string;
  terceroRazonSocial?: string;
  centroCostoNombre?: string;
}

export interface LibroMayorResponseDto {
  empresaRut: string;
  cuentaCodigo: string;
  cuentaNombre: string;
  lineas: LibroMayorLineaDto[];
  totalDebe: number;
  totalHaber: number;
  saldoFinal: number;
  saldoInicial?: number;
  esDeudor: boolean;
}

export interface CuentaConMovimientosDto {
  cuentaCodigo: string;
  cuentaNombre: string;
  lineas: LibroMayorLineaDto[];
  totalDebe: number;
  totalHaber: number;
  saldoFinal: number;
  saldoInicial?: number;
  esDeudor: boolean;
}

export interface LibroMayorCompletoResponse {
  empresaRut: string;
  periodoAnio?: number;
  periodoMes?: number;
  cuentas: CuentaConMovimientosDto[];
}

export interface BalanceResponse {
  empresaRut: string;
  periodoAnio?: number;
  periodoMes?: number;
  cuentas: CuentaBalanceDto[];
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

export interface BorradorF29Response {
  empresaRut: string;
  periodoAnio?: number;
  periodoMes?: number;
  totalIvaDebito: number;
  totalIvaCredito: number;
  totalRetencionHonorarios: number;
  ivaAPagar: number;
}

export interface EvolucionMes {
  mes: number;
  anio: number;
  ingresos: number;
  egresos: number;
  utilidad: number;
}

export interface EvolucionResultados {
  empresaRut: string;
  meses: EvolucionMes[];
}

export interface LibroDiarioLineaDto {
  dia: string;
  tipo: string;
  comprobante: string;
  secuencia: string;
  glosa: string;
  debe: number;
  haber: number;
  cuenta: string;
}

export interface LibroDiarioResponseDto {
  empresaRut: string;
  periodoAnio: number;
  periodoMes: number;
  lineas: LibroDiarioLineaDto[];
  totalesMes: { debe: number; haber: number; };
  acumulacionesAnteriores: { debe: number; haber: number; };
  totalesPeriodo: { debe: number; haber: number; };
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = '/api/reportes';

  getBalance(empresaRut: string, anio: number, mes?: number, fechaDesde?: string, fechaHasta?: string): Observable<BalanceGeneral> {
    let params = new HttpParams().set('empresaRut', empresaRut).set('anio', anio.toString());
    if (mes !== undefined) params = params.set('mes', mes.toString());
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);
    return this.http.get<BalanceGeneral>(`${this.apiUrl}/balance`, { params });
  }

  getBorradorF29(empresaRut: string, anio?: number, mes?: number): Observable<BorradorF29Response> {
    let params = new HttpParams().set('empresaRut', empresaRut);
    if (anio !== undefined) params = params.set('anio', anio.toString());
    if (mes !== undefined) params = params.set('mes', mes.toString());
    
    return this.http.get<BorradorF29Response>(`${this.apiUrl}/borrador-f29`, { params });
  }

  getLibroMayor(empresaRut: string, cuentaCodigo: string, anio?: number, mes?: number): Observable<LibroMayorResponseDto> {
    let params = new HttpParams().set('empresaRut', empresaRut);
    if (anio !== undefined) params = params.set('anio', anio.toString());
    if (mes !== undefined) params = params.set('mes', mes.toString());

    return this.http.get<LibroMayorResponseDto>(`${this.apiUrl}/libro-mayor/${cuentaCodigo}`, { params });
  }

  getEvolucionResultados(empresaRut: string, anio?: number, mes?: number): Observable<EvolucionResultados> {
    let params = new HttpParams().set('empresaRut', empresaRut);
    if (anio !== undefined) params = params.set('anio', anio.toString());
    if (mes !== undefined) params = params.set('mes', mes.toString());
    
    return this.http.get<EvolucionResultados>(`${this.apiUrl}/evolucion-resultados`, { params });
  }

  getAniosDisponibles(empresaRut: string): Observable<number[]> {
    const params = new HttpParams().set('empresaRut', empresaRut);
    return this.http.get<number[]>(`${this.apiUrl}/anios-disponibles`, { params });
  }

  getLibroDiario(empresaRut: string, anio?: number, mes?: number): Observable<LibroDiarioResponseDto> {
    let params = new HttpParams().set('empresaRut', empresaRut);
    if (anio !== undefined) params = params.set('anio', anio.toString());
    if (mes !== undefined) params = params.set('mes', mes.toString());
    
    return this.http.get<LibroDiarioResponseDto>(`${this.apiUrl}/libro-diario`, { params });
  }

  getLibroMayorCompleto(empresaRut: string, anio?: number, mes?: number): Observable<LibroMayorCompletoResponse> {
    let params = new HttpParams().set('empresaRut', empresaRut);
    if (anio !== undefined) params = params.set('anio', anio.toString());
    if (mes !== undefined) params = params.set('mes', mes.toString());
    
    return this.http.get<LibroMayorCompletoResponse>(`${this.apiUrl}/libro-mayor-completo`, { params });
  }

  exportarAExcel(datos: any[], nombreArchivo: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datos);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`);
  }
}
