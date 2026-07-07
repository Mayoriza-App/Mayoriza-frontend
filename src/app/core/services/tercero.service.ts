import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tercero } from '../interfaces/tercero.interface';

@Injectable({
  providedIn: 'root',
})
export class TerceroService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/terceros`;

  findAll(): Observable<Tercero[]> {
    return this.http.get<Tercero[]>(this.apiUrl);
  }

  create(tercero: Tercero): Observable<Tercero> {
    return this.http.post<Tercero>(this.apiUrl, tercero);
  }
}
