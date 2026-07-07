import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AppStateService } from '../../../core/state/app.state';
import { EmpresaService } from '../../../core/services/empresa.service';
import { AuthService } from '../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { effect, computed } from '@angular/core';
import { switchMap } from 'rxjs';
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    MatIconModule, 
    MatMenuModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  public appState = inject(AppStateService);
  public authService = inject(AuthService);
  private empresaService = inject(EmpresaService);

  public empresasResource = toSignal(
    this.appState.refreshEmpresas$.pipe(
      switchMap(() => this.empresaService.findAll())
    ), 
    { initialValue: null }
  );

  public empresasActivas = computed(() => {
    const empresas = this.empresasResource();
    if (empresas === null) return null;
    return empresas.filter(e => e.activa !== false);
  });

  public empresaActiva = computed(() => {
    const rut = this.appState.empresaRutActiva();
    const empresas = this.empresasActivas();
    if (!empresas) return null;
    return empresas.find(e => e.rut === rut) || null;
  });

  public isAdmin = computed(() => this.authService.currentUser()?.rol === 'ADMIN');

  constructor() {
    effect(() => {

      if (this.isAdmin()) return;

      const empresas = this.empresasActivas();
      const activa = this.appState.empresaRutActiva();

      if (empresas === null) return;

      if (empresas.length > 0) {

        if (!activa || !empresas.find(e => e.rut === activa)) {

          this.appState.clearEmpresa();
        }
      } else if (empresas.length === 0 && activa) {

        this.appState.clearEmpresa();
      }
    }, { allowSignalWrites: true });
  }

  seleccionarEmpresa(rut: string) {
    this.appState.setEmpresa(rut);
  }

  logout() {
    this.authService.logout();
  }
}
