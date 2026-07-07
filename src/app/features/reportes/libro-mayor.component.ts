import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AppStateService } from '../../core/state/app.state';
import { ReporteService } from '../../core/services/reporte.service';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { PdfService } from '../../core/services/pdf.service';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { FilterCuentasPipe } from '../../shared/pipes/filter-cuentas.pipe';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap, catchError, of, map } from 'rxjs';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-libro-mayor',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, ReactiveFormsModule, 
    MatTableModule, MatProgressSpinnerModule, MatIconModule, 
    MatButtonModule, MatSelectModule, MatFormFieldModule, MatTooltipModule,
    MatAutocompleteModule, MatInputModule, FilterCuentasPipe
  ],
  templateUrl: './libro-mayor.component.html',
})
export class LibroMayorComponent {
  private appState = inject(AppStateService);
  private reporteService = inject(ReporteService);
  private contabilidadService = inject(ContabilidadService);
  private empresaService = inject(EmpresaService);
  private pdfService = inject(PdfService);
  
  public cuentaSeleccionada = signal<string | null>(null);
  public cuentaSearchCtrl = new FormControl('');

  private rut$ = toObservable(this.appState.empresaRutActiva);
  private cuenta$ = toObservable(this.cuentaSeleccionada);

  public cuentasResource = toSignal(
    this.rut$.pipe(
      switchMap(rut => rut ? this.contabilidadService.getCuentas(rut) : of([]))
    ),
    { initialValue: [] }
  );

  displayCuenta(codigo: string): string {
    if (!codigo) return '';
    const cuentas = this.cuentasResource();
    const cuenta = cuentas.find((c: any) => c.codigo === codigo);
    return cuenta ? `${cuenta.codigo} - ${cuenta.nombre}` : codigo;
  }

  public vistaActual = signal<'CUENTA' | 'COMPLETO'>('CUENTA');
  
  public loadCompletoTrigger = signal<number>(0);
  private loadCompleto$ = toObservable(this.loadCompletoTrigger);

  public anioSeleccionado = signal<number>(new Date().getFullYear());
  public mesSeleccionado = signal<number | null>(null);

  private anio$ = toObservable(this.anioSeleccionado);
  private mes$ = toObservable(this.mesSeleccionado);

  public aniosDisponiblesResource = toSignal(
    this.rut$.pipe(
      switchMap(rut => rut ? this.reporteService.getAniosDisponibles(rut) : of([new Date().getFullYear()]))
    ),
    { initialValue: [new Date().getFullYear()] }
  );

  public meses = [
    { valor: null, etiqueta: 'Todo el año' },
    { valor: 1, etiqueta: 'Enero' },
    { valor: 2, etiqueta: 'Febrero' },
    { valor: 3, etiqueta: 'Marzo' },
    { valor: 4, etiqueta: 'Abril' },
    { valor: 5, etiqueta: 'Mayo' },
    { valor: 6, etiqueta: 'Junio' },
    { valor: 7, etiqueta: 'Julio' },
    { valor: 8, etiqueta: 'Agosto' },
    { valor: 9, etiqueta: 'Septiembre' },
    { valor: 10, etiqueta: 'Octubre' },
    { valor: 11, etiqueta: 'Noviembre' },
    { valor: 12, etiqueta: 'Diciembre' }
  ];

  public libroMayorResource = toSignal(
    combineLatest([this.rut$, this.cuenta$, this.anio$, this.mes$]).pipe(
      switchMap(([rut, codigo, anio, mes]) => {
        if (!rut || !codigo) {
          return of({ data: null, loading: false, error: null });
        }
        
        return this.reporteService.getLibroMayor(rut, codigo, anio, mes || undefined).pipe(
          map(data => ({ data, loading: false, error: null })),
          catchError(err => of({ data: null, loading: false, error: err.message }))
        );
      })
    ),
    { initialValue: { data: null, loading: false, error: null } }
  );

  public libroMayorCompletoResource = toSignal(
    combineLatest([this.rut$, this.loadCompleto$, this.anio$, this.mes$]).pipe(
      switchMap(([rut, trigger, anio, mes]) => {
        if (!rut || trigger === 0) return of({ data: null, loading: false, error: null });
        return this.reporteService.getLibroMayorCompleto(rut, anio, mes || undefined).pipe(
          map(data => ({ data, loading: false, error: null })),
          catchError(err => of({ data: null, loading: false, error: err.message }))
        );
      })
    ),
    { initialValue: { data: null, loading: false, error: null } }
  );

  public displayedColumns: string[] = ['fecha', 'comprobanteId', 'comprobanteTipo', 'glosaLinea', 'debe', 'haber', 'saldoAcumulado'];

  onCuentaSeleccionada(codigo: string) {
    this.cuentaSeleccionada.set(codigo);
  }

  onAnioSeleccionado(anio: number) {
    this.anioSeleccionado.set(anio);
  }

  onMesSeleccionado(mes: number | null) {
    this.mesSeleccionado.set(mes);
  }

  exportarExcel() {
    const dataObj = this.libroMayorResource().data;
    if (!dataObj) return;

    const rows = dataObj.lineas.map((l: any) => ({
      'Fecha': l.fecha,
      'N° Comprobante': l.comprobanteId,
      'Tipo': l.comprobanteTipo,
      'Tercero (RUT)': l.terceroRut || '',
      'Tercero (Razón Social)': l.terceroRazonSocial || '',
      'Centro Costo': l.centroCostoNombre || '',
      'Glosa / Detalle': l.glosaLinea,
      'Debe': l.debe,
      'Haber': l.haber,
      'Saldo Acumulado': l.saldoAcumulado
    }));

    this.reporteService.exportarAExcel(rows, `Libro_Mayor_Analitico_${dataObj.cuentaCodigo}_${dataObj.empresaRut}`);
  }

  cargarCompleto() {
    this.vistaActual.set('COMPLETO');
    if (this.loadCompletoTrigger() === 0) {
      this.loadCompletoTrigger.set(1);
    }
  }

  exportarPDFCompleto() {
    const dataObj = this.libroMayorCompletoResource().data;
    if (!dataObj) return;

    this.empresaService.findAll().subscribe(empresas => {
      const empresa = empresas.find(e => e.rut === this.appState.empresaRutActiva());
      const razonSocial = empresa ? empresa.razonSocial : 'Razón Social No Disponible';
      
      this.pdfService.exportarLibroMayorCompleto(dataObj, {
        rut: this.appState.empresaRutActiva() || '',
        razonSocial
      });
    });
  }
}
