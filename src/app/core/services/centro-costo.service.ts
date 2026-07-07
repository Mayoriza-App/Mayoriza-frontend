import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CentroCosto } from '../interfaces/tercero.interface';

@Injectable({
  providedIn: 'root'
})
export class CentroCostoService {
  private http = inject(HttpClient);
  private apiUrl = '/api/centros-costo';

  findAll(): Observable<CentroCosto[]> {
    return this.http.get<CentroCosto[]>(this.apiUrl);
  }

  create(data: { nombre: string }): Observable<CentroCosto> {
    return this.http.post<CentroCosto>(this.apiUrl, data);
  }
}
