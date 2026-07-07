import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tercero } from '../interfaces/tercero.interface';

@Injectable({
  providedIn: 'root'
})
export class TerceroService {
  private http = inject(HttpClient);
  private apiUrl = '/api/terceros';

  findAll(): Observable<Tercero[]> {
    return this.http.get<Tercero[]>(this.apiUrl);
  }

  create(tercero: Tercero): Observable<Tercero> {
    return this.http.post<Tercero>(this.apiUrl, tercero);
  }
}
