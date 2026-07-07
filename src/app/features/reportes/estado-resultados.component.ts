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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-estado-resultados',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './estado-resultados.component.html'
})
export class EstadoResultadosComponent {
  private reporteService = inject(ReporteService);
  public appState = inject(AppStateService);

  public isLoading = signal(false);
  public error = signal<string | null>(null);

  public anioSeleccionado = signal<number>(new Date().getFullYear());
  public mesSeleccionado = signal<number | null>(null);

  public anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  public meses = [
    { value: null, label: 'Todos los meses' },
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  public ingresos = signal<any[]>([]);
  public gastos = signal<any[]>([]);
  
  public totalIngresos = signal(0);
  public totalGastos = signal(0);
  public utilidad = signal(0);

  constructor() {
    effect(() => {
      const rut = this.appState.empresaRutActiva();
      const anio = this.anioSeleccionado();
      const mes = this.mesSeleccionado();
      if (rut) {
        this.cargarReporte(rut, anio, mes);
      } else {
        this.ingresos.set([]);
        this.gastos.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private cargarReporte(empresaRut: string, anio: number, mes: number | null) {
    this.isLoading.set(true);
    this.error.set(null);

    this.reporteService.getBalance(empresaRut, anio, mes ?? undefined).subscribe({
      next: (data) => {
        const ing = data.cuentas.filter((c: any) => c.ganancia > 0 && c.tipo === 'RESULTADO_GANANCIA');
        const gst = data.cuentas.filter((c: any) => c.perdida > 0 && c.tipo === 'RESULTADO_PERDIDA');

        this.ingresos.set(ing);
        this.gastos.set(gst);

        this.totalIngresos.set(data.totales.resultadoGanancia);
        this.totalGastos.set(data.totales.resultadoPerdida);
        this.utilidad.set(data.totales.utilidadDelEjercicio);

        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el Estado de Resultados.');
        this.isLoading.set(false);
      }
    });
  }

  exportarPdf() {
    const doc = new jsPDF();
    const rut = this.appState.empresaRutActiva();
    const title = 'ESTADO DE RESULTADOS INTEGRAL';
    const mesLabel = this.mesSeleccionado()
      ? this.meses.find(m => m.value === this.mesSeleccionado())?.label
      : 'Todo el año';
    
    doc.setFontSize(16);
    doc.text(title, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Empresa RUT: ${rut}  |  Período: ${mesLabel} / ${this.anioSeleccionado()}`, 105, 28, { align: 'center' });

    autoTable(doc, {
      startY: 40,
      head: [['Código', 'Cuenta (Ingresos / Ganancias)', 'Monto']],
      body: this.ingresos().map(a => [a.cuentaCodigo, a.cuentaNombre, `$ ${a.ganancia.toLocaleString('es-CL')}`]),
      foot: [['', 'TOTAL INGRESOS', `$ ${this.totalIngresos().toLocaleString('es-CL')}`]],
      theme: 'striped',
      headStyles: { fillColor: [46, 204, 113] }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Código', 'Cuenta (Costos / Gastos / Pérdidas)', 'Monto']],
      body: this.gastos().map(p => [p.cuentaCodigo, p.cuentaNombre, `$ ${p.perdida.toLocaleString('es-CL')}`]),
      foot: [['', 'TOTAL GASTOS', `$ ${this.totalGastos().toLocaleString('es-CL')}`]],
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60] }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['RESUMEN DEL EJERCICIO', '']],
      body: [
        ['UTILIDAD / PÉRDIDA NETA', `$ ${this.utilidad().toLocaleString('es-CL')}`]
      ],
      theme: 'grid',
      styles: { fontStyle: 'bold', fontSize: 14 }
    });

    doc.save(`estado-resultados-${rut}.pdf`);
  }
}
