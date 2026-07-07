import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AppStateService } from '../../core/state/app.state';
import { ComprobanteService } from '../../core/services/comprobante.service';
import { Comprobante } from '../../core/interfaces/comprobante.interface';
import { switchMap, catchError, of, map, combineLatest } from 'rxjs';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DetalleComprobanteDialogComponent } from './components/detalle-comprobante-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/dialogs/confirm-dialog.component';
import { ReporteService } from '../../core/services/reporte.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-lista-comprobantes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CurrencyPipe, 
    DatePipe, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterModule
  ],
  templateUrl: './lista-comprobantes.component.html',
})
export class ListaComprobantesComponent {
  private appState = inject(AppStateService);
  private comprobanteService = inject(ComprobanteService);
  private reporteService = inject(ReporteService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  private empresaRut$ = toObservable(this.appState.empresaRutActiva);

  public anioSeleccionado = signal<number>(new Date().getFullYear());
  public anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  private anio$ = toObservable(this.anioSeleccionado);

  public columnsToDisplay = ['id', 'fecha', 'tipo', 'glosaGeneral', 'debe', 'haber', 'estado', 'acciones'];

  public comprobantesResource = toSignal(
    combineLatest([this.empresaRut$, this.anio$]).pipe(
      switchMap(([rut, anio]) => {
        if (!rut) return of({ data: [], loading: false, error: null });
        return this.comprobanteService.findAll(rut, anio).pipe(
          map(data => ({ loading: false, data, error: null })),
          catchError(err => of({ loading: false, data: [], error: err.message }))
        );
      })
    ),
    { initialValue: { loading: true, data: [], error: null } }
  );

  public comprobantesOrdenados = computed(() => {
    const data = this.comprobantesResource().data || [];
    return [...data].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
  });

  getTipoColor(tipo: string): string {
    switch(tipo) {
      case 'INGRESO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'EGRESO': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'TRASPASO': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  openDetalle(comprobante: Comprobante) {
    this.dialog.open(DetalleComprobanteDialogComponent, {
      data: comprobante,
      width: '700px',
      maxWidth: '95vw'
    });
  }

  eliminarComprobante(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Comprobante',
        message: '¿Estás seguro de que deseas eliminar este comprobante? Esta acción no se puede deshacer y borrará todas sus líneas.',
        confirmText: 'Eliminar',
        isDestructive: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.comprobanteService.remove(id).subscribe({
          next: () => {
            this.toastService.success(`Comprobante #${id} eliminado correctamente.`);
            window.location.reload();
          },
          error: (err: any) => {
            const errorMsg = err.error?.message || err.message || 'Error desconocido';
            this.toastService.error(`Error al eliminar: ${errorMsg}`);
          }
        });
      }
    });
  }

  exportarExcel() {
    const data = this.comprobantesResource().data || [];
    if (data.length === 0) return;

    const datosPlanos = data.map(c => ({
      'ID Comprobante': c.id,
      'Fecha': c.fecha,
      'Tipo': c.tipo,
      'Glosa General': c.glosaGeneral,
      'Total Debe (CLP)': c.totales?.debe || 0,
      'Total Haber (CLP)': c.totales?.haber || 0,
      'Estado': (c.totales?.cuadrado ? 'Cuadrado' : 'Descuadrado')
    }));

    this.reporteService.exportarAExcel(datosPlanos, `Libro_Diario_${this.appState.empresaRutActiva()}`);
  }

  exportarVoucherPdf(comprobante: Comprobante) {
    const doc = new jsPDF();
    const rut = this.appState.empresaRutActiva();

    doc.setFontSize(18);
    doc.text(`Comprobante Contable #${comprobante.id}`, 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Empresa RUT: ${rut}`, 14, 30);
    doc.text(`Fecha: ${comprobante.fecha}`, 14, 36);
    doc.text(`Tipo: ${comprobante.tipo}`, 14, 42);
    doc.text(`Glosa: ${comprobante.glosaGeneral}`, 14, 48);

    const movimientos = [...(comprobante.movimientos || [])].sort((a, b) => {

      const aEsDebe = (a.debe || 0) > 0;
      const bEsDebe = (b.debe || 0) > 0;
      
      if (aEsDebe && !bEsDebe) return -1;
      if (!aEsDebe && bEsDebe) return 1;
      
      return a.cuentaCodigo.localeCompare(b.cuentaCodigo);
    });

    const tableData = movimientos.map(m => [
      m.cuentaCodigo,
      m.glosaLinea || '',
      m.debe ? m.debe.toLocaleString('es-CL') : '0',
      m.haber ? m.haber.toLocaleString('es-CL') : '0'
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Cuenta', 'Glosa Línea', 'Debe ($)', 'Haber ($)']],
      body: tableData,
      foot: [['', 'TOTAL COMPROBANTE', comprobante.totales?.debe?.toLocaleString('es-CL') || '0', comprobante.totales?.haber?.toLocaleString('es-CL') || '0']],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'right' },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 55;

    doc.setFontSize(10);
    const lineY = finalY + 50;
    doc.line(20, lineY, 70, lineY);
    doc.text('Preparado por', 30, lineY + 5);

    doc.line(80, lineY, 130, lineY);
    doc.text('Revisado por', 90, lineY + 5);

    doc.line(140, lineY, 190, lineY);
    doc.text('Aprobado por', 150, lineY + 5);

    doc.save(`Voucher_Comprobante_${comprobante.id}.pdf`);
  }
}
