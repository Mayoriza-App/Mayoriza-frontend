import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppStateService } from '../../core/state/app.state';
import { CierreEjercicioDialogComponent } from './cierre-ejercicio-dialog.component';
import { AperturaEjercicioDialogComponent } from './apertura-ejercicio-dialog.component';

@Component({
  selector: 'app-procesos',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Procesos Contables</h1>
        <p class="text-slate-500 mt-1">Automatización de rutinas financieras complejas</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- Apertura de Ejercicio Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-start transition-all hover:shadow-md hover:border-emerald-200">
          <div class="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <mat-icon>lock_open</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">Asiento de Apertura</h2>
          <p class="text-slate-500 text-sm mb-6 flex-1">
            Inicia un nuevo año contable arrastrando automáticamente los saldos finales de Activo, Pasivo y Patrimonio del año anterior.
          </p>
          <button mat-flat-button color="primary" class="!bg-emerald-600 hover:!bg-emerald-700 w-full" (click)="abrirAperturaEjercicio()">
            Iniciar Apertura
          </button>
        </div>

        <!-- Cierre de Ejercicio Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-start transition-all hover:shadow-md hover:border-violet-200">
          <div class="h-12 w-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
            <mat-icon>event_busy</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-800 mb-2">Cierre de Ejercicio</h2>
          <p class="text-slate-500 text-sm mb-6 flex-1">
            Refundición de resultados. Cierra todas las cuentas de pérdida y ganancia contra el Patrimonio (Utilidad del Ejercicio) al final del año.
          </p>
          <button mat-flat-button color="primary" class="!bg-violet-600 hover:!bg-violet-700 w-full" (click)="abrirCierreEjercicio()">
            Iniciar Proceso
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProcesosComponent {
  private dialog = inject(MatDialog);
  private appState = inject(AppStateService);

  abrirCierreEjercicio() {
    this.dialog.open(CierreEjercicioDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { empresaRut: this.appState.empresaRutActiva() }
    });
  }

  abrirAperturaEjercicio() {
    this.dialog.open(AperturaEjercicioDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { empresaRut: this.appState.empresaRutActiva() }
    });
  }
}
