import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comprobante } from '../interfaces/comprobante.interface';

@Injectable({
  providedIn: 'root',
})
export class ComprobanteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/comprobantes`;

  findAll(
    empresaRut: string,
    anio?: number,
    mes?: number,
  ): Observable<Comprobante[]> {
    let params = new HttpParams().set('empresaRut', empresaRut);
    if (anio) params = params.set('anio', anio.toString());
    if (mes) params = params.set('mes', mes.toString());
    return this.http.get<Comprobante[]>(this.apiUrl, { params });
  }

  create(comprobante: any): Observable<Comprobante> {
    return this.http.post<Comprobante>(this.apiUrl, comprobante);
  }

  findOne(id: number): Observable<Comprobante> {
    return this.http.get<Comprobante>(`${this.apiUrl}/${id}`);
  }

  update(id: number, comprobante: any): Observable<Comprobante> {
    return this.http.patch<Comprobante>(`${this.apiUrl}/${id}`, comprobante);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  generarAsientoCierre(payload: {
    empresaRut: string;
    anio: number;
    cuentaPatrimonioCodigo: string;
    fechaCierre: string;
  }): Observable<Comprobante> {
    return this.http.post<Comprobante>(
      `${this.apiUrl}/cierre-ejercicio`,
      payload,
    );
  }

  generarAsientoApertura(payload: {
    empresaRut: string;
    anioAAbrir: number;
    fechaApertura: string;
  }): Observable<Comprobante> {
    return this.http.post<Comprobante>(
      `${this.apiUrl}/apertura-ejercicio`,
      payload,
    );
  }
}
