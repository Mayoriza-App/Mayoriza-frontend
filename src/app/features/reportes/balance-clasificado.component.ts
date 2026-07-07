import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';
import { AppStateService } from '../../core/state/app.state';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-balance-clasificado',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './balance-clasificado.component.html'
})
export class BalanceClasificadoComponent {
  protected Math = Math;
  private reporteService = inject(ReporteService);
  public appState = inject(AppStateService);

  public isLoading = signal(false);
  public error = signal<string | null>(null);

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

  public activoCirculante = signal<any[]>([]);
  public activoFijo = signal<any[]>([]);
  public otrosActivos = signal<any[]>([]);

  public pasivoCirculante = signal<any[]>([]);
  public pasivoLargoPlazo = signal<any[]>([]);
  public patrimonio = signal<any[]>([]);
  
  public totalActivoCirculante = signal(0);
  public totalActivoFijo = signal(0);
  public totalOtrosActivos = signal(0);

  public totalPasivoCirculante = signal(0);
  public totalPasivoLargoPlazo = signal(0);
  public totalPatrimonio = signal(0);

  public totalActivos = signal(0);
  public totalPasivos = signal(0);
  public utilidad = signal(0);

  constructor() {
    effect(() => {
      const rut = this.appState.empresaRutActiva();
      const anio = this.anioSeleccionado();
      const dDesde = this.diaDesde();
      const mDesde = this.mesDesde();
      const dHasta = this.diaHasta();
      const mHasta = this.mesHasta();
      
      if (rut) {
        const pad = (n: number) => n < 10 ? '0' + n : n;
        const fechaDesde = `${anio}-${pad(mDesde)}-${pad(dDesde)}`;
        const fechaHasta = `${anio}-${pad(mHasta)}-${pad(dHasta)}`;
        this.cargarReporte(rut, anio, fechaDesde, fechaHasta);
      } else {
        this.activoCirculante.set([]);
        this.activoFijo.set([]);
        this.otrosActivos.set([]);
        this.pasivoCirculante.set([]);
        this.pasivoLargoPlazo.set([]);
        this.patrimonio.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private cargarReporte(empresaRut: string, anio: number, fechaDesde: string, fechaHasta: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.reporteService.getBalance(empresaRut, anio, undefined, fechaDesde, fechaHasta).subscribe({
      next: (data) => {


        const allActivos = data.cuentas.filter((c: any) => c.tipo === 'ACTIVO');
        const allPasivosPatrimonio = data.cuentas.filter((c: any) => c.tipo === 'PASIVO' || c.tipo === 'PATRIMONIO');

        allActivos.forEach((c: any) => {
           c.activo = c.saldoDeudor - c.saldoAcreedor;
        });
        allPasivosPatrimonio.forEach((c: any) => {
           c.pasivo = c.saldoAcreedor - c.saldoDeudor;
        });

        const actCirc = allActivos.filter((c: any) => c.cuentaCodigo.startsWith('11') && c.activo !== 0);
        const actFijo = allActivos.filter((c: any) => c.cuentaCodigo.startsWith('12') && c.activo !== 0);
        const otrosAct = allActivos.filter((c: any) => !c.cuentaCodigo.startsWith('11') && !c.cuentaCodigo.startsWith('12') && c.activo !== 0);

        const pasCirc = allPasivosPatrimonio.filter((c: any) => c.cuentaCodigo.startsWith('21') && c.pasivo !== 0);
        const pasLP = allPasivosPatrimonio.filter((c: any) => c.cuentaCodigo.startsWith('22') && c.pasivo !== 0);
        const pat = allPasivosPatrimonio.filter((c: any) => !c.cuentaCodigo.startsWith('21') && !c.cuentaCodigo.startsWith('22') && c.pasivo !== 0);

        this.activoCirculante.set(actCirc);
        this.activoFijo.set(actFijo);
        this.otrosActivos.set(otrosAct);

        this.pasivoCirculante.set(pasCirc);
        this.pasivoLargoPlazo.set(pasLP);
        this.patrimonio.set(pat);

        const sumActivos = allActivos.reduce((acc: number, curr: any) => acc + curr.activo, 0);
        const sumPasivos = pasCirc.reduce((a: number, c: any) => a + c.pasivo, 0) + pasLP.reduce((a: number, c: any) => a + c.pasivo, 0);
        const sumPatrimonio = pat.reduce((a: number, c: any) => a + c.pasivo, 0);

        this.totalActivoCirculante.set(actCirc.reduce((acc: number, curr: any) => acc + curr.activo, 0));
        this.totalActivoFijo.set(actFijo.reduce((acc: number, curr: any) => acc + curr.activo, 0));
        this.totalOtrosActivos.set(otrosAct.reduce((acc: number, curr: any) => acc + curr.activo, 0));

        this.totalPasivoCirculante.set(pasCirc.reduce((acc: number, curr: any) => acc + curr.pasivo, 0));
        this.totalPasivoLargoPlazo.set(pasLP.reduce((acc: number, curr: any) => acc + curr.pasivo, 0));
        this.totalPatrimonio.set(sumPatrimonio);

        this.totalActivos.set(sumActivos);
        this.totalPasivos.set(sumPasivos);
        this.utilidad.set(data.totales.utilidadDelEjercicio);

        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el Estado de Situación Financiera.');
        this.isLoading.set(false);
      }
    });
  }

  exportarPdf() {
    const doc = new jsPDF();
    const rut = this.appState.empresaRutActiva();
    const title = 'BALANCE CLASIFICADO';
    
    const pad = (n: number) => n < 10 ? '0' + n : n;
    const mesLabelDesde = this.meses.find(m => m.value === this.mesDesde())?.label || '';
    const mesLabelHasta = this.meses.find(m => m.value === this.mesHasta())?.label || '';
    const periodoStr = `Desde el ${pad(this.diaDesde())} de ${mesLabelDesde} hasta el ${pad(this.diaHasta())} de ${mesLabelHasta} de ${this.anioSeleccionado()}`;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(periodoStr, 105, 22, { align: 'center' });

    doc.setLineWidth(0.2);
    doc.line(14, 25, 196, 25);

    const activosRows: any[] = [];
    if (this.activoCirculante().length > 0) {
      activosRows.push(['', 'ACTIVO CIRCULANTE', '']);
      this.activoCirculante().forEach(c => activosRows.push([c.cuentaCodigo, c.cuentaNombre, c.activo]));
      activosRows.push(['', '-------------------------', '']);
      activosRows.push(['', '', this.totalActivoCirculante()]);
    }
    if (this.activoFijo().length > 0) {
      activosRows.push(['', 'ACTIVO FIJO', '']);
      this.activoFijo().forEach(c => activosRows.push([c.cuentaCodigo, c.cuentaNombre, c.activo]));
      activosRows.push(['', '-------------------------', '']);
      activosRows.push(['', '', this.totalActivoFijo()]);
    }
    if (this.otrosActivos().length > 0) {
      activosRows.push(['', 'OTROS ACTIVOS', '']);
      this.otrosActivos().forEach(c => activosRows.push([c.cuentaCodigo, c.cuentaNombre, c.activo]));
      activosRows.push(['', '-------------------------', '']);
      activosRows.push(['', '', this.totalOtrosActivos()]);
    }

    activosRows.push(['', '', '']);
    activosRows.push(['', 'TOTAL ACTIVOS', this.totalActivos()]);
    
    if (this.utilidad() < 0) {
      activosRows.push(['', 'PERDIDA DEL EJERCICIO', Math.abs(this.utilidad())]);
      activosRows.push(['', '-------------------------', '']);
      activosRows.push(['', '', this.totalActivos() + Math.abs(this.utilidad())]);
      activosRows.push(['', '=========================', '']);
    }

    const pasivosRows: any[] = [];
    if (this.pasivoCirculante().length > 0) {
      pasivosRows.push(['', 'PASIVO CIRCULANTE', '']);
      this.pasivoCirculante().forEach(c => pasivosRows.push([c.cuentaCodigo, c.cuentaNombre, c.pasivo]));
      pasivosRows.push(['', '-------------------------', '']);
      pasivosRows.push(['', '', this.totalPasivoCirculante()]);
    }
    if (this.pasivoLargoPlazo().length > 0) {
      pasivosRows.push(['', 'PASIVO A LARGO PLAZO', '']);
      this.pasivoLargoPlazo().forEach(c => pasivosRows.push([c.cuentaCodigo, c.cuentaNombre, c.pasivo]));
      pasivosRows.push(['', '-------------------------', '']);
      pasivosRows.push(['', '', this.totalPasivoLargoPlazo()]);
    }
    if (this.patrimonio().length > 0 || this.utilidad() >= 0) {
      pasivosRows.push(['', 'PATRIMONIO', '']);
      this.patrimonio().forEach(c => pasivosRows.push([c.cuentaCodigo, c.cuentaNombre, c.pasivo]));
      if (this.utilidad() >= 0) {
        pasivosRows.push(['', 'UTILIDAD DEL EJERCICIO', this.utilidad()]);
      }
      pasivosRows.push(['', '-------------------------', '']);
      pasivosRows.push(['', '', this.totalPatrimonio() + (this.utilidad() >= 0 ? this.utilidad() : 0)]);
    }

    pasivosRows.push(['', '', '']);
    pasivosRows.push(['', 'TOTAL PASIVOS', this.totalPasivos() + this.totalPatrimonio() + (this.utilidad() >= 0 ? this.utilidad() : 0)]);
    pasivosRows.push(['', '=========================', '']);

    const unifiedRows = [];
    const maxRows = Math.max(activosRows.length, pasivosRows.length);
    for (let i = 0; i < maxRows; i++) {
      const act = activosRows[i] || ['', '', ''];
      const pas = pasivosRows[i] || ['', '', ''];
      const fmt = (val: any) => typeof val === 'number' ? val.toLocaleString('es-CL') : val;
      unifiedRows.push([
        act[0], act[1], fmt(act[2]),
        pas[0], pas[1], fmt(pas[2])
      ]);
    }

    autoTable(doc, {
      startY: 32,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 1, textColor: [0, 0, 0] },
      head: [['', 'ACTIVOS', '', '', 'PASIVOS', '']],
      body: unifiedRows,
      headStyles: { halign: 'center', fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 55 },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 15 },
        4: { cellWidth: 55 },
        5: { cellWidth: 20, halign: 'right' }
      }
    });

    doc.save(`balance-clasificado-${rut}.pdf`);
  }
}
