import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empresa, Usuario } from '../interfaces/empresa-usuario.interface';

export interface EmpresaConDueño extends Empresa {
  duenoActual: Usuario | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = '/api/admin';

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
  }

  inviteUsuario(data: { email: string, nombre: string }): Observable<{ message: string, usuario: Usuario }> {
    return this.http.post<{ message: string, usuario: Usuario }>(`${this.apiUrl}/usuarios`, data);
  }

  getEmpresas(): Observable<EmpresaConDueño[]> {
    return this.http.get<EmpresaConDueño[]>(`${this.apiUrl}/empresas`);
  }

  transferirEmpresa(rut: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/empresas/${rut}/transferir`, {});
  }

  toggleUserStatus(id: string): Observable<{ mensaje: string; usuario: Usuario }> {
    return this.http.patch<{ mensaje: string; usuario: Usuario }>(`${this.apiUrl}/usuarios/${id}/toggle-status`, {});
  }
}
