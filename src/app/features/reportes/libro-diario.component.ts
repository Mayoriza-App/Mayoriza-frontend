import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../../core/state/app.state';
import { ReporteService, LibroDiarioResponseDto } from '../../core/services/reporte.service';

@Component({
  selector: 'app-libro-diario',
  standalone: true,
  imports: [
    CommonModule, 
    CurrencyPipe, 
    MatTableModule, 
    MatProgressSpinnerModule, 
    MatIconModule, 
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './libro-diario.component.html',
  styles: [`
    .dense-table .mat-mdc-row, 
    .dense-table .mat-mdc-header-row, 
    .dense-table .mat-mdc-footer-row {
      height: 36px !important;
      min-height: 36px !important;
    }
    .dense-table .mat-mdc-cell, 
    .dense-table .mat-mdc-header-cell, 
    .dense-table .mat-mdc-footer-cell {
      padding: 0 12px !important;
      font-size: 13px !important;
    }
  `]
})
export class LibroDiarioComponent {
  public appState = inject(AppStateService);
  private reporteService = inject(ReporteService);

  public meses = [
    { value: 0, label: 'Todos los meses' },
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  public anios = signal<number[]>([new Date().getFullYear()]);

  public selectedMes = signal<number>(new Date().getMonth() + 1);
  public selectedAnio = signal<number>(new Date().getFullYear());

  public isLoading = signal(false);
  public error = signal<string | null>(null);
  public reportData = signal<LibroDiarioResponseDto | null>(null);

  public displayedColumns = ['dia', 'tipo', 'comprobante', 'secuencia', 'glosa', 'debe', 'haber', 'cuenta'];

  constructor() {
    effect(() => {
      const rut = this.appState.empresaRutActiva();

      if (rut) {
        this.loadAnios(rut);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const rut = this.appState.empresaRutActiva();
      const mes = this.selectedMes();
      const anio = this.selectedAnio();

      if (rut && this.anios().length > 0) {


        if (this.anios().includes(anio)) {
          this.loadData(rut, mes, anio);
        }
      } else {
        this.reportData.set(null);
      }
    }, { allowSignalWrites: true });
  }

  loadAnios(rut: string) {
    this.reporteService.getAniosDisponibles(rut).subscribe({
      next: (anios) => {
        this.anios.set(anios);
        if (!anios.includes(this.selectedAnio())) {
          this.selectedAnio.set(anios[0]); // Seleccionar el año más reciente si el actual no existe
        }
      },
      error: () => {
        this.anios.set([new Date().getFullYear()]);
      }
    });
  }

  loadData(rut: string, mes: number, anio: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.reporteService.getLibroDiario(rut, anio, mes).subscribe({
      next: (data) => {
        this.reportData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar el Libro Diario');
        this.isLoading.set(false);
      }
    });
  }

  exportarExcel() {
    const data = this.reportData();
    if (!data || data.lineas.length === 0) return;

    const excelData = data.lineas.map(l => ({
      'Día': l.dia,
      'Tipo': l.tipo,
      'Comp.': l.comprobante,
      'Sec.': l.secuencia,
      'Glosa': l.glosa,
      'Debe': l.debe,
      'Haber': l.haber,
      'Cuenta': l.cuenta
    }));

    this.reporteService.exportarAExcel(excelData, `Libro_Diario_${data.periodoAnio}_${data.periodoMes}`);
  }
}
