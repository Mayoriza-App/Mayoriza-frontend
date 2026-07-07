import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Empresa } from '../interfaces/empresa-usuario.interface';

export interface OpcionesPlan {
  plantillas: { id: number; nombre: string }[];
  empresas: { rut: string; razonSocial: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private http = inject(HttpClient);
  private apiUrl = '/api/empresas';

  findAll(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.apiUrl);
  }

  getOpcionesPlan(): Observable<OpcionesPlan> {
    return this.http.get<OpcionesPlan>(`${this.apiUrl}/opciones-plan`);
  }

  findOne(rut: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/${rut}`);
  }

  create(empresa: Partial<Empresa>): Observable<Empresa> {
    return this.http.post<Empresa>(this.apiUrl, empresa);
  }

  updateEmpresa(rut: string, empresa: Partial<Empresa>): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.apiUrl}/${rut}`, empresa);
  }

  habilitarTransferencia(rut: string, destinoEmail: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${rut}/habilitar-transferencia`, { destinoEmail });
  }

  cambiarEstadoEmpresa(rut: string, activa: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${rut}/estado`, { activa });
  }
}
