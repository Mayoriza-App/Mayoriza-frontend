import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CentroCosto,
  CuentaContable,
  Tercero,
} from '../interfaces/contabilidad.interface';

@Injectable({
  providedIn: 'root',
})
export class ContabilidadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cuentas-contables`;

  getCuentas(empresaRut: string): Observable<CuentaContable[]> {
    const params = new HttpParams().set('empresaRut', empresaRut);
    return this.http.get<CuentaContable[]>(this.apiUrl, { params });
  }

  getPlantillaCuentas(planId: number): Observable<CuentaContable[]> {
    return this.http.get<CuentaContable[]>(
      `${this.apiUrl}/plantilla/${planId}`,
    );
  }

  clonarCuentas(payload: {
    empresaRut: string;
    origenPlanId?: number;
    origenEmpresaRut?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/clonar`, payload);
  }

  createCuenta(cuenta: Partial<CuentaContable>): Observable<CuentaContable> {
    return this.http.post<CuentaContable>(this.apiUrl, cuenta);
  }

  updateCuenta(
    empresaRut: string,
    codigo: string,
    cuenta: Partial<CuentaContable>,
  ): Observable<CuentaContable> {
    const params = new HttpParams().set('empresaRut', empresaRut);
    return this.http.patch<CuentaContable>(`${this.apiUrl}/${codigo}`, cuenta, {
      params,
    });
  }

  eliminarCuenta(empresaRut: string, codigo: string): Observable<void> {
    const params = new HttpParams().set('empresaRut', empresaRut);
    return this.http.delete<void>(`${this.apiUrl}/${codigo}`, { params });
  }

  getCentrosCosto(empresaRut: string): Observable<CentroCosto[]> {
    const params = new HttpParams().set('empresaRut', empresaRut);
    return this.http.get<CentroCosto[]>('/centros-costo', { params });
  }

  getTerceros(): Observable<Tercero[]> {
    return this.http.get<Tercero[]>('/terceros');
  }
}
