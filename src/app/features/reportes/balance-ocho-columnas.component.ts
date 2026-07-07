import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AppStateService } from '../../core/state/app.state';
import { ReporteService } from '../../core/services/reporte.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { switchMap, catchError, of, map, combineLatest } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-membrete-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="p-6 max-w-sm">
      <h2 class="text-xl font-bold mb-4 text-slate-800">Exportar Balance</h2>
      <p class="text-slate-600 mb-6 leading-relaxed">
        ¿Desea incluir el membrete y los datos de la empresa en el PDF?
      </p>
      <div class="flex justify-end space-x-3">
        <button mat-button class="!rounded-lg text-slate-500" (click)="dialogRef.close('cancel')">Cancelar</button>
        <button mat-stroked-button class="!rounded-lg text-slate-700" (click)="dialogRef.close(false)">No</button>
        <button mat-flat-button class="!rounded-lg !bg-violet-600 !text-white" (click)="dialogRef.close(true)">Sí, incluir</button>
      </div>
    </div>
  `
})
export class MembreteDialogComponent {
  constructor(public dialogRef: MatDialogRef<MembreteDialogComponent>) {}
}

@Component({
  selector: 'app-balance-ocho-columnas',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, MatTableModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatDialogModule],
  templateUrl: './balance-ocho-columnas.component.html',
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
export class BalanceOchoColumnasComponent {
  protected Math = Math;
  private appState = inject(AppStateService);
  private reporteService = inject(ReporteService);
  private empresaService = inject(EmpresaService);

  public anioSeleccionado = signal<number>(new Date().getFullYear());
  
  public diaDesde = signal<number>(1);
  public mesDesde = signal<number>(1);
  
  public diaHasta = signal<number>(31);
  public mesHasta = signal<number>(12);

  public anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  public dias = Array.from({ length: 31 }, (_, i) => i + 1);
  public meses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  private empresaRut$ = toObservable(this.appState.empresaRutActiva);
  private anio$ = toObservable(this.anioSeleccionado);
  
  private diaDesde$ = toObservable(this.diaDesde);
  private mesDesde$ = toObservable(this.mesDesde);
  private diaHasta$ = toObservable(this.diaHasta);
  private mesHasta$ = toObservable(this.mesHasta);

  public balanceResource = toSignal(
    combineLatest([this.empresaRut$, this.anio$, this.diaDesde$, this.mesDesde$, this.diaHasta$, this.mesHasta$]).pipe(
      switchMap(([rut, anio, dDesde, mDesde, dHasta, mHasta]) => {
        if (!rut) return of({ data: null, loading: false, error: null });
        
        const pad = (n: number) => n < 10 ? '0' + n : n;
        const fechaDesde = `${anio}-${pad(mDesde)}-${pad(dDesde)}`;
        const fechaHasta = `${anio}-${pad(mHasta)}-${pad(dHasta)}`;

        return this.reporteService.getBalance(rut, anio, undefined, fechaDesde, fechaHasta).pipe(
          map(data => ({ loading: false, data, error: null })),
          catchError(err => of({ loading: false, data: null, error: err.message }))
        );
      })
    ),
    { initialValue: { loading: true, data: null, error: null } }
  );

  public dataSource = computed(() => {
    const data = this.balanceResource().data;
    if (!data) return [];
    
    const cuentas: any[] = [...data.cuentas];
    const t = data.totales;

    cuentas.push({
      cuentaCodigo: '',
      cuentaNombre: 'Sumas',
      totalDebe: t.debe, totalHaber: t.haber,
      saldoDeudor: t.saldoDeudor, saldoAcreedor: t.saldoAcreedor,
      activo: t.activos, pasivo: t.pasivos,
      perdida: t.resultadoPerdida, ganancia: t.resultadoGanancia,
      isTotalRow: true,
      isSumaRow: true
    });

    const util = t.utilidadDelEjercicio;
    if (util >= 0) {
      cuentas.push({
        cuentaCodigo: '',
        cuentaNombre: 'Utilidad del Ejercicio',
        totalDebe: null, totalHaber: null,
        saldoDeudor: null, saldoAcreedor: null,
        activo: null, pasivo: util,
        perdida: null, ganancia: util,
        isTotalRow: true,
        isUtilidad: true
      });
      cuentas.push({
        cuentaCodigo: '',
        cuentaNombre: 'Totales',
        totalDebe: null, totalHaber: null,
        saldoDeudor: null, saldoAcreedor: null,
        activo: t.activos, pasivo: t.pasivos + util,
        perdida: t.resultadoPerdida + util, ganancia: t.resultadoGanancia,
        isTotalRow: true,
        isSumaTotal: true
      });
    } else {
      const perdida = Math.abs(util);
      cuentas.push({
        cuentaCodigo: '',
        cuentaNombre: 'Pérdida del Ejercicio',
        totalDebe: null, totalHaber: null,
        saldoDeudor: null, saldoAcreedor: null,
        activo: perdida, pasivo: null,
        perdida: null, ganancia: perdida,
        isTotalRow: true,
        isUtilidad: true
      });
      cuentas.push({
        cuentaCodigo: '',
        cuentaNombre: 'Totales',
        totalDebe: null, totalHaber: null,
        saldoDeudor: null, saldoAcreedor: null,
        activo: t.activos + perdida, pasivo: t.pasivos,
        perdida: t.resultadoPerdida, ganancia: t.resultadoGanancia + perdida,
        isTotalRow: true,
        isSumaTotal: true
      });
    }
    
    return cuentas;
  });

  public totales = computed(() => {
    return this.balanceResource().data?.totales || null;
  });

  public displayedColumns: string[] = [
    'cuenta', 'debe', 'haber', 'saldoDeudor', 'saldoAcreedor',
    'activo', 'pasivo', 'perdida', 'ganancia'
  ];

  /** Activo - Pasivo */
  public resultadoFinanciero = computed(() => {
    const t = this.totales();
    if (!t) return 0;
    return t.activos - t.pasivos;
  });

  /** true si Resultado Financiero === Resultado Económico */
  public cuadraturaOk = computed(() => {
    const t = this.totales();
    if (!t) return true;
    return (t.activos - t.pasivos) === t.utilidadDelEjercicio;
  });

  exportarExcel() {
    const data = this.balanceResource().data;
    if (!data) return;

    const rows = data.cuentas.map(c => ({
      'Código': c.cuentaCodigo,
      'Cuenta': c.cuentaNombre,
      'Débitos': c.totalDebe,
      'Créditos': c.totalHaber,
      'Saldo Deudor': c.saldoDeudor,
      'Saldo Acreedor': c.saldoAcreedor,
      'Activos': c.activo,
      'Pasivos': c.pasivo,
      'Pérdidas': c.perdida,
      'Ganancias': c.ganancia
    }));

    this.reporteService.exportarAExcel(rows, `Balance_8_Columnas_${data.empresaRut}`);
  }

  private dialog = inject(MatDialog);

  exportarPdf() {
    const data = this.balanceResource().data;
    if (!data) return;
    const rut = data.empresaRut;

    const dialogRef = this.dialog.open(MembreteDialogComponent, {
      width: '350px',
      autoFocus: false,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((incluyeMembrete) => {

      if (incluyeMembrete === 'cancel') return;

      this.empresaService.findOne(rut).subscribe((empresa: any) => {
        const doc = new jsPDF('landscape');
        
        let currentY = 20;

        if (incluyeMembrete === true) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(empresa.razonSocial.toUpperCase(), 14, currentY);
          doc.setFont('helvetica', 'normal');
          if (empresa.giro) doc.text(empresa.giro, 14, currentY + 5);
          if (empresa.rut) doc.text(`RUT: ${empresa.rut}`, 14, currentY + 10);
          if (empresa.direccion) doc.text(empresa.direccion, 14, currentY + 15);
        }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('BALANCE GENERAL', 148, currentY + 10, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let periodo = '';
      const pad = (n: number) => n < 10 ? '0' + n : n;
      const from = `${pad(this.diaDesde())}-${pad(this.mesDesde())}-${this.anioSeleccionado()}`;
      const to = `${pad(this.diaHasta())}-${pad(this.mesHasta())}-${this.anioSeleccionado()}`;
      periodo = `${from} AL ${to}`;
      doc.text(`Período: ${periodo}`, 148, currentY + 18, { align: 'center' });
      
      const startY = currentY + 25;

    const bodyRows = data.cuentas.map(c => [
      c.cuentaNombre,
      c.totalDebe > 0 ? c.totalDebe.toLocaleString('es-CL') : '',
      c.totalHaber > 0 ? c.totalHaber.toLocaleString('es-CL') : '',
      c.saldoDeudor > 0 ? c.saldoDeudor.toLocaleString('es-CL') : '',
      c.saldoAcreedor > 0 ? c.saldoAcreedor.toLocaleString('es-CL') : '',
      c.activo > 0 ? c.activo.toLocaleString('es-CL') : '',
      c.pasivo > 0 ? c.pasivo.toLocaleString('es-CL') : '',
      c.perdida > 0 ? c.perdida.toLocaleString('es-CL') : '',
      c.ganancia > 0 ? c.ganancia.toLocaleString('es-CL') : ''
    ]);

    const t = data.totales;
    bodyRows.push([
      'Sumas',
      t.debe.toLocaleString('es-CL'),
      t.haber.toLocaleString('es-CL'),
      t.saldoDeudor.toLocaleString('es-CL'),
      t.saldoAcreedor.toLocaleString('es-CL'),
      t.activos.toLocaleString('es-CL'),
      t.pasivos.toLocaleString('es-CL'),
      t.resultadoPerdida.toLocaleString('es-CL'),
      t.resultadoGanancia.toLocaleString('es-CL')
    ]);

    const util = t.utilidadDelEjercicio;
    if (util >= 0) {
      bodyRows.push([
        'Utilidad del Ejercicio', '', '', '', '', '',
        util.toLocaleString('es-CL'), util.toLocaleString('es-CL'), ''
      ]);
      bodyRows.push([
        'Totales', '', '', '', '',
        (t.activos).toLocaleString('es-CL'),
        (t.pasivos + util).toLocaleString('es-CL'),
        (t.resultadoPerdida + util).toLocaleString('es-CL'),
        (t.resultadoGanancia).toLocaleString('es-CL')
      ]);
    } else {
      const perdida = Math.abs(util);
      bodyRows.push([
        'Pérdida del Ejercicio', '', '', '', '',
        perdida.toLocaleString('es-CL'), '', '', perdida.toLocaleString('es-CL')
      ]);
      bodyRows.push([
        'Totales', '', '', '', '',
        (t.activos + perdida).toLocaleString('es-CL'),
        (t.pasivos).toLocaleString('es-CL'),
        (t.resultadoPerdida).toLocaleString('es-CL'),
        (t.resultadoGanancia + perdida).toLocaleString('es-CL')
      ]);
    }

    autoTable(doc, {
      startY: startY,
      head: [['Cuenta', 'Debitos', 'Creditos', 'S. Deudor', 'S. Acreedor', 'Activo', 'Pasivo', 'Perdidas', 'Ganancias']],
      body: bodyRows,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fontStyle: 'bold', lineWidth: 0.5, lineColor: [0,0,0], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' },
        4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' },
        7: { halign: 'right' }, 8: { halign: 'right' }
      },
      didParseCell: function(data) {
        if (data.row.index >= bodyRows.length - 3) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.row.index === bodyRows.length - 3) {
          data.cell.styles.lineWidth = { top: 0.5 };
          data.cell.styles.lineColor = [0,0,0];
        }
        if (data.row.index === bodyRows.length - 1) {
          data.cell.styles.lineWidth = { top: 0.5, bottom: 0.5 };
          data.cell.styles.lineColor = [0,0,0];
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text('Declaro dejando constancia que el presente Balance General, ha sido confeccionado con datos e informaciones fidedignas y fueron', 148, finalY, { align: 'center' });
    doc.text('proporcionados a nuestro Contador, dando cumplimiento al Articulo 100 del Codigo Tributario.', 148, finalY + 4, { align: 'center' });

    doc.setFontSize(10);
    doc.text('_____________________________', 60, finalY + 30, { align: 'center' });
    doc.text('Contador', 60, finalY + 35, { align: 'center' });
    
    const repNombre = empresa.representanteNombre || 'Representante Legal';
    const repRut = empresa.representanteRut ? `RUT: ${empresa.representanteRut}` : '';
    doc.text('_____________________________', 230, finalY + 30, { align: 'center' });
    doc.text(repNombre, 230, finalY + 35, { align: 'center' });
    if (repRut) doc.text(repRut, 230, finalY + 40, { align: 'center' });
    doc.save(`Balance_Tributario_${data.empresaRut}.pdf`);
      });
    });
  }
}
