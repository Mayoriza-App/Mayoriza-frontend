import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AppStateService } from '../../core/state/app.state';
import { ReporteService } from '../../core/services/reporte.service';
import { switchMap, catchError, of, map, combineLatest } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private appState = inject(AppStateService);
  private reporteService = inject(ReporteService);

  private empresaRut$ = toObservable(this.appState.empresaRutActiva);

  public anioSeleccionado = signal<number>(new Date().getFullYear());
  public mesSeleccionado = signal<number>(new Date().getMonth() + 1);

  public anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  public meses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  private anio$ = toObservable(this.anioSeleccionado);
  private mes$ = toObservable(this.mesSeleccionado);

  public balanceResource = toSignal(
    combineLatest([this.empresaRut$, this.anio$, this.mes$]).pipe(
      switchMap(([rut, anio, mes]) => {
        if (!rut) return of({ data: null, loading: false, error: null });
        return this.reporteService.getBalance(rut, anio, mes).pipe(
          map(data => ({ loading: false, data, error: null })),
          catchError(err => of({ loading: false, data: null, error: err.message }))
        );
      })
    ),
    { initialValue: { loading: true, data: null, error: null } }
  );

  public f29Resource = toSignal(
    combineLatest([this.empresaRut$, this.anio$, this.mes$]).pipe(
      switchMap(([rut, anio, mes]) => {
        if (!rut) return of({ data: null, loading: false, error: null });
        return this.reporteService.getBorradorF29(rut, anio, mes).pipe(
          map(data => ({ loading: false, data, error: null })),
          catchError(err => of({ loading: false, data: null, error: err.message }))
        );
      })
    ),
    { initialValue: { loading: true, data: null, error: null } }
  );

  public evolucionResource = toSignal(
    combineLatest([this.empresaRut$, this.anio$]).pipe(
      switchMap(([rut, anio]) => {
        if (!rut) return of({ data: null, loading: false, error: null });
        return this.reporteService.getEvolucionResultados(rut, anio).pipe(
          map(data => ({ loading: false, data, error: null })),
          catchError(err => of({ loading: false, data: null, error: err.message }))
        );
      })
    ),
    { initialValue: { loading: true, data: null, error: null } }
  );

  public resultadoMes = computed(() => {
    const data = this.balanceResource().data;
    if (!data || !data.totales) return 0;
    return data.totales.utilidadDelEjercicio;
  });

  public liquidez = computed(() => {
    const data = this.balanceResource().data;
    if (!data) return 0;
    return data.cuentas
      .filter(c => c.tipo === 'ACTIVO' && (c.cuentaCodigo.startsWith('1101') || c.cuentaCodigo.startsWith('1102')))
      .reduce((sum, c) => sum + (c.saldoDeudor - c.saldoAcreedor), 0);
  });

  public cuentasPorCobrar = computed(() => {
    const data = this.balanceResource().data;
    if (!data) return 0;
    return data.cuentas
      .filter(c => c.tipo === 'ACTIVO' && c.cuentaCodigo.startsWith('1104'))
      .reduce((sum, c) => sum + (c.saldoDeudor - c.saldoAcreedor), 0);
  });

  public cuentasPorPagar = computed(() => {
    const data = this.balanceResource().data;
    if (!data) return 0;
    return data.cuentas
      .filter(c => c.tipo === 'PASIVO' && (c.cuentaCodigo.startsWith('2101') || c.cuentaCodigo.startsWith('2102') || c.cuentaCodigo.startsWith('2104')))
      .reduce((sum, c) => sum + (c.saldoAcreedor - c.saldoDeudor), 0);
  });

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  public barChartType: ChartType = 'bar';

  public chartData = computed<ChartData<'bar'>>(() => {
    const data = this.evolucionResource().data;
    if (!data) return { labels: [], datasets: [] };

    const labels = data.meses.map(m => `${m.mes}/${m.anio}`);
    const ingresos = data.meses.map(m => m.ingresos);
    const egresos = data.meses.map(m => m.egresos);

    return {
      labels,
      datasets: [
        { data: ingresos, label: 'Ingresos', backgroundColor: '#7c3aed', borderRadius: 4 },
        { data: egresos, label: 'Egresos', backgroundColor: '#fb7185', borderRadius: 4 },
      ]
    };
  });
}
