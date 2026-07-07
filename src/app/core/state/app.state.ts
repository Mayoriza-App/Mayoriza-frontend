import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  public readonly empresaRutActiva = signal<string | null>(
    localStorage.getItem('empresaRutActiva') || null
  );

  public readonly empresaRutActiva$ = new BehaviorSubject<string | null>(
    localStorage.getItem('empresaRutActiva') || null
  );

  public readonly refreshEmpresas$ = new BehaviorSubject<void>(undefined);

  setEmpresa(rut: string) {
    this.empresaRutActiva.set(rut);
    this.empresaRutActiva$.next(rut);
    localStorage.setItem('empresaRutActiva', rut);
  }

  clearEmpresa() {
    this.empresaRutActiva.set(null);
    this.empresaRutActiva$.next(null);
    localStorage.removeItem('empresaRutActiva');
  }

  triggerRefreshEmpresas() {
    this.refreshEmpresas$.next();
  }
}
